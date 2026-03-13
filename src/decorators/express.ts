import { Express, RequestHandler } from 'express';
import { RouteHandlers } from '../types/express';

/**
 * Method decorator that registers a route handler on the enclosing controller.
 *
 * The decorator stores the handler (and any preceding middleware) in
 * `reflect-metadata` under the `"routeHandlers"` key so that
 * {@link defineRoutes} can later mount them on an Express application.
 *
 * @param method - The HTTP method to register (must be a valid method key on
 *   the Express application, e.g. `"get"`, `"post"`, `"put"`, `"delete"`).
 * @param path - The route path relative to the controller's base route.
 *   Defaults to `""` (i.e. the controller root).
 * @param middleware - Zero or more Express middleware functions that are
 *   executed **before** the decorated handler.
 *
 * @example
 * ```ts
 * class UserController {
 *   \@Route('get', '/:id', authMiddleware)
 *   getUser(req: Request, res: Response) {
 *     res.json({ id: req.params.id });
 *   }
 * }
 * ```
 */
export function Route(
  method: keyof Express,
  path: string = '',
  ...middleware: RequestHandler[]
) {
  return (target: object, _key: string, descriptor: PropertyDescriptor) => {
    const routeHandlers: RouteHandlers =
      Reflect.getMetadata('routeHandlers', target) || new Map();

    if (!routeHandlers.has(method)) {
      routeHandlers.set(method, new Map());
    }

    routeHandlers.get(method)?.set(path, [...middleware, descriptor.value]);

    Reflect.defineMetadata('routeHandlers', routeHandlers, target);
  };
}

/**
 * Class decorator that marks a class as an Express controller and sets its
 * base route prefix.
 *
 * The base route is stored in `reflect-metadata` under the `"baseRoute"` key
 * and is prepended to every route path registered by {@link Route} decorators
 * on the class's methods.
 *
 * @param baseRoute - The base path prefix for all routes in the controller
 *   (e.g. `"/users"`). Defaults to `""` (no prefix).
 *
 * @example
 * ```ts
 * \@Controller('/users')
 * class UserController {
 *   \@Route('get', '/:id')
 *   getUser(req: Request, res: Response) { ... }
 * }
 * ```
 */
export function Controller(baseRoute: string = '') {
  return (target: object) => {
    Reflect.defineMetadata('baseRoute', baseRoute, target);
  };
}
