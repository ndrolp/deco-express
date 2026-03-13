import { Express, RequestHandler } from 'express';

/**
 * A nested map that stores route handlers organised by HTTP method and path.
 *
 * Outer key – an HTTP method name that exists on the Express application
 * (e.g. `"get"`, `"post"`, `"put"`, `"delete"`).
 *
 * Inner key – the route path string (e.g. `"/users/:id"`).
 *
 * Inner value – an ordered array of Express `RequestHandler` functions,
 * where middleware precedes the actual route handler.
 */
export type RouteHandlers = Map<keyof Express, Map<string, RequestHandler[]>>;
