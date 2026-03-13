import { Express } from 'express';
import { RouteHandlers } from '../types/express';

/** Any class constructor that produces instances of type `T`. */
type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Registers routes from one or more controller classes onto an Express
 * application.
 *
 * For each controller the function:
 * 1. Instantiates the class with `new`.
 * 2. Reads the `"baseRoute"` metadata set by {@link Controller}.
 * 3. Reads the `"routeHandlers"` metadata set by {@link Route}.
 * 4. Mounts each handler at the resolved full path on the Express app.
 *
 * The full path is built as:
 * ```
 * [/api][/v{version}]{baseRoute}{routePath}
 * ```
 *
 * @param controllers - Array of controller class constructors to register.
 * @param application - The Express application instance to mount routes on.
 * @param addApi - When `true` (default), prepends `/api` to every route.
 * @param version - API version number. When `addApi` is `true` and `version`
 *   is non-zero, a `/v{version}` segment is inserted after `/api`.
 *   Defaults to `1`.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { defineRoutes } from 'deco-express';
 * import { UserController } from './controllers/user';
 *
 * const app = express();
 * defineRoutes([UserController], app);
 * // Routes are now available at /api/v1/...
 * ```
 */
export function defineRoutes(
  controllers: Constructor[],
  application: Express,
  addApi: boolean = true,
  version: number = 1,
) {
  for (const ControllerClass of controllers) {
    const controller = new ControllerClass();

    const routeHandlers: RouteHandlers = Reflect.getMetadata(
      'routeHandlers',
      controller,
    );
    const controllerPath: string =
      Reflect.getMetadata('baseRoute', controller.constructor) ?? '';

    if (!routeHandlers) continue;

    for (const [method, routes] of routeHandlers) {
      for (const [routePath, handlers] of routes) {
        const versionSegment = addApi && version ? `/v${version}` : '';
        const fullPath = `${addApi ? '/api' : ''}${versionSegment}${controllerPath}${routePath}`;
        application[method](fullPath, handlers);
      }
    }
  }
}
