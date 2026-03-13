import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Controller, Route } from '../decorators/express';
import { RouteHandlers } from '../types/express';

describe('@Controller', () => {
  it('stores the base route in metadata', () => {
    @Controller('/users')
    class UserController {}

    const baseRoute = Reflect.getMetadata('baseRoute', UserController);
    expect(baseRoute).toBe('/users');
  });

  it('defaults to an empty string when no base route is provided', () => {
    @Controller()
    class RootController {}

    const baseRoute = Reflect.getMetadata('baseRoute', RootController);
    expect(baseRoute).toBe('');
  });
});

describe('@Route', () => {
  it('registers a GET route handler on the prototype', () => {
    class PostController {
      @Route('get', '/list')
      list() {}
    }

    const handlers: RouteHandlers = Reflect.getMetadata(
      'routeHandlers',
      PostController.prototype,
    );

    expect(handlers).toBeDefined();
    expect(handlers.has('get')).toBe(true);
    expect(handlers.get('get')?.has('/list')).toBe(true);
  });

  it('registers a POST route handler', () => {
    class PostController {
      @Route('post', '/create')
      create() {}
    }

    const handlers: RouteHandlers = Reflect.getMetadata(
      'routeHandlers',
      PostController.prototype,
    );

    expect(handlers.has('post')).toBe(true);
    expect(handlers.get('post')?.has('/create')).toBe(true);
  });

  it('includes middleware before the handler', () => {
    const mw1 = () => {};
    const mw2 = () => {};

    class MwController {
      @Route('get', '/protected', mw1 as never, mw2 as never)
      protected() {}
    }

    const handlers: RouteHandlers = Reflect.getMetadata(
      'routeHandlers',
      MwController.prototype,
    );

    const routeHandlers = handlers.get('get')?.get('/protected');
    expect(routeHandlers).toHaveLength(3); // mw1, mw2, handler
    expect(routeHandlers?.[0]).toBe(mw1);
    expect(routeHandlers?.[1]).toBe(mw2);
  });

  it('defaults path to empty string', () => {
    class DefaultPathController {
      @Route('get')
      index() {}
    }

    const handlers: RouteHandlers = Reflect.getMetadata(
      'routeHandlers',
      DefaultPathController.prototype,
    );

    expect(handlers.get('get')?.has('')).toBe(true);
  });

  it('can register multiple routes on the same controller', () => {
    class MultiController {
      @Route('get', '/a')
      a() {}

      @Route('post', '/b')
      b() {}
    }

    const handlers: RouteHandlers = Reflect.getMetadata(
      'routeHandlers',
      MultiController.prototype,
    );

    expect(handlers.get('get')?.has('/a')).toBe(true);
    expect(handlers.get('post')?.has('/b')).toBe(true);
  });
});
