import { Express, RequestHandler } from 'express';

export type RouteHandlers = Map<keyof Express, Map<string, RequestHandler[]>>;
