import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

/**
 * Method decorator that validates `req.body` against a Joi schema before the
 * decorated handler is invoked.
 *
 * When validation fails the decorator short-circuits the request and responds
 * with HTTP **422 Unprocessable Entity** and a structured error body:
 *
 * ```json
 * {
 *   "message": "Validation failed",
 *   "details": [{ "field": "email", "message": "\"email\" must be a valid email" }]
 * }
 * ```
 *
 * Any non-validation error thrown by Joi is forwarded to the next Express
 * error handler via `next(error)`.
 *
 * @param schema - A Joi schema used to validate `req.body`.
 *
 * @example
 * ```ts
 * const createUserSchema = Joi.object({ email: Joi.string().email().required() });
 *
 * class UserController {
 *   \@Route('post', '/')
 *   \@Validate(createUserSchema)
 *   createUser(req: Request, res: Response) {
 *     res.status(201).json({ email: req.body.email });
 *   }
 * }
 * ```
 */
export function Validate(schema: Joi.Schema) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      req: Request,
      res: Response,
      next: NextFunction,
    ) {
      try {
        await schema.validateAsync(req.body);
      } catch (error) {
        if (error instanceof Joi.ValidationError) {
          return res.status(422).json({
            message: 'Validation failed',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          });
        }
        return next(error);
      }

      return originalMethod.call(this, req, res, next);
    };

    return descriptor;
  };
}
