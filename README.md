# deco-express

> Decorator-based utilities for building Express.js REST APIs in TypeScript.

`deco-express` reduces boilerplate when building Express applications by providing a small set of TypeScript decorators for defining controllers, routes, and request validation.

---

## Installation

```bash
npm install deco-express reflect-metadata
```

> `reflect-metadata` is a required peer dependency. Import it **once** at the entry point of your application before using any decorators.

```ts
// src/main.ts
import 'reflect-metadata';
```

Also ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Quick Start

```ts
import 'reflect-metadata';
import express from 'express';
import Joi from 'joi';
import { Controller, Route, Validate, defineRoutes } from 'deco-express';

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
});

@Controller('/users')
class UserController {
  @Route('get', '/list')
  async list(req, res) {
    res.json({ users: [] });
  }

  @Validate(createUserSchema)
  @Route('post', '/create')
  async create(req, res) {
    res.status(201).json({ created: req.body });
  }
}

const app = express();
app.use(express.json());

defineRoutes([UserController], app);
// Registers:
//   GET  /api/v1/users/list
//   POST /api/v1/users/create

app.listen(3000);
```

---

## API Reference

### `@Controller(baseRoute?)`

Class decorator. Marks a class as a route controller and sets its base path.

| Parameter   | Type     | Default | Description                     |
| ----------- | -------- | ------- | ------------------------------- |
| `baseRoute` | `string` | `''`    | Base path prefix for all routes |

```ts
@Controller('/products')
class ProductController { ... }
```

---

### `@Route(method, path?, ...middleware)`

Method decorator. Maps a class method to an HTTP route.

| Parameter    | Type               | Default | Description                          |
| ------------ | ------------------ | ------- | ------------------------------------ |
| `method`     | `keyof Express`    | —       | HTTP method (`get`, `post`, etc.)    |
| `path`       | `string`           | `''`    | Route path (appended to base route)  |
| `middleware` | `RequestHandler[]` | `[]`    | Optional Express middleware to apply |

```ts
@Route('get', '/list', authMiddleware)
async list(req, res) { ... }
```

---

### `@Validate(schema)`

Method decorator. Validates `req.body` against a Joi schema before the handler runs.
Returns `422 Unprocessable Entity` on validation failure with structured error details.

| Parameter | Type         | Description                    |
| --------- | ------------ | ------------------------------ |
| `schema`  | `Joi.Schema` | Joi schema to validate against |

```ts
@Validate(Joi.object({ name: Joi.string().required() }))
@Route('post', '/create')
async create(req, res) { ... }
```

**Error response format (422):**

```json
{
  "message": "Validation failed",
  "details": [{ "field": "name", "message": "\"name\" is required" }]
}
```

---

### `defineRoutes(controllers, app, addApi?, version?)`

Registers all decorated controller routes to an Express application.

| Parameter     | Type            | Default | Description                            |
| ------------- | --------------- | ------- | -------------------------------------- |
| `controllers` | `Constructor[]` | —       | Array of controller class constructors |
| `app`         | `Express`       | —       | Express application instance           |
| `addApi`      | `boolean`       | `true`  | Prepend `/api` to all routes           |
| `version`     | `number`        | `1`     | API version number (e.g. `/v1`)        |

```ts
defineRoutes([UserController, ProductController], app, true, 2);
// Routes become: /api/v2/...

defineRoutes([UserController], app, false);
// Routes become: /users/...
```

---

## Route Path Construction

The final route path is built as:

```
/{api}/{version}/{baseRoute}/{path}
```

| `addApi` | `version` | Result prefix |
| -------- | --------- | ------------- |
| `true`   | `1`       | `/api/v1`     |
| `true`   | `2`       | `/api/v2`     |
| `false`  | any       | (no prefix)   |

---

## License

MIT
