import { Express, RequestHandler } from 'express';
import { RouteHandlers } from '../types/express';

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

        routeHandlers
            .get(method)
            ?.set(path, [...middleware, descriptor.value]);

        Reflect.defineMetadata('routeHandlers', routeHandlers, target);
    };
}

export function Controller(baseRoute: string = '') {
    return (target: object) => {
        Reflect.defineMetadata('baseRoute', baseRoute, target);
    };
}
