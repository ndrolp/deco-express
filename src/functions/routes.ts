import { Express } from 'express';
import { RouteHandlers } from '../types/express';

type Constructor<T = object> = new (...args: unknown[]) => T;

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
