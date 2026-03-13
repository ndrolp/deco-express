import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

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
