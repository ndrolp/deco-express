import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Controller, Route } from '../decorators/express';
import { defineRoutes } from '../functions/routes';

function mockApp() {
  const routes: Record<string, { path: string; handlers: unknown[] }[]> = {};
  const app = new Proxy(
    {},
    {
      get(_, method: string) {
        return (path: string, handlers: unknown[]) => {
          if (!routes[method]) routes[method] = [];
          routes[method].push({ path, handlers });
        };
      },
    },
  );
  return { app: app as never, routes };
}

describe('defineRoutes', () => {
  it('registers routes with API versioning by default', () => {
    @Controller('/items')
    class ItemController {
      @Route('get', '/list')
      list() {}
    }

    const { app, routes } = mockApp();
    defineRoutes([ItemController], app);

    expect(routes['get']).toHaveLength(1);
    expect(routes['get'][0].path).toBe('/api/v1/items/list');
  });

  it('registers routes without API prefix when addApi is false', () => {
    @Controller('/items')
    class ItemController {
      @Route('get', '/list')
      list() {}
    }

    const { app, routes } = mockApp();
    defineRoutes([ItemController], app, false);

    expect(routes['get'][0].path).toBe('/items/list');
  });

  it('uses the correct version number', () => {
    @Controller('/v')
    class VersionController {
      @Route('get', '/test')
      test() {}
    }

    const { app, routes } = mockApp();
    defineRoutes([VersionController], app, true, 2);

    expect(routes['get'][0].path).toBe('/api/v2/v/test');
  });

  it('registers multiple controllers', () => {
    @Controller('/a')
    class AController {
      @Route('get', '/one')
      one() {}
    }

    @Controller('/b')
    class BController {
      @Route('post', '/two')
      two() {}
    }

    const { app, routes } = mockApp();
    defineRoutes([AController, BController], app);

    expect(routes['get'][0].path).toBe('/api/v1/a/one');
    expect(routes['post'][0].path).toBe('/api/v1/b/two');
  });

  it('skips controllers with no route handlers', () => {
    @Controller('/empty')
    class EmptyController {}

    const { app, routes } = mockApp();
    defineRoutes([EmptyController], app);

    expect(Object.keys(routes)).toHaveLength(0);
  });

  it('passes handlers array to the app method', () => {
    const mw = vi.fn();

    @Controller('/mw')
    class MwController {
      @Route('get', '/path', mw as never)
      handle() {}
    }

    const { app, routes } = mockApp();
    defineRoutes([MwController], app);

    const handlers = routes['get'][0].handlers;
    expect(handlers).toHaveLength(2); // middleware + method
    expect(handlers[0]).toBe(mw);
  });
});
