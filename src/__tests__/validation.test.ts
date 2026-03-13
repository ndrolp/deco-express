import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Validate } from '../decorators/validation';

function mockReqRes(body: unknown = {}) {
    const req = { body } as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;
    return { req, res, next };
}

const schema = Joi.object({ name: Joi.string().required() });

describe('@Validate', () => {
    it('calls the original method when body is valid', async () => {
        const handler = vi.fn();

        class TestController {
            @Validate(schema)
            handle(req: Request, res: Response, next: NextFunction) {
                handler(req, res, next);
            }
        }

        const { req, res, next } = mockReqRes({ name: 'Alice' });
        const ctrl = new TestController();
        await ctrl.handle(req, res, next);

        expect(handler).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 422 with structured error when body is invalid', async () => {
        class TestController {
            @Validate(schema)
            handle(_req: Request, _res: Response, _next: NextFunction) {}
        }

        const { req, res, next } = mockReqRes({ name: 123 });
        const ctrl = new TestController();
        await ctrl.handle(req, res, next);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({ field: 'name' }),
                ]),
            }),
        );
    });

    it('returns 422 when a required field is missing', async () => {
        class TestController {
            @Validate(schema)
            handle(_req: Request, _res: Response, _next: NextFunction) {}
        }

        const { req, res, next } = mockReqRes({});
        const ctrl = new TestController();
        await ctrl.handle(req, res, next);

        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('calls next(error) for unexpected errors', async () => {
        const badSchema = {
            validateAsync: async () => {
                throw new Error('Unexpected');
            },
        } as unknown as Joi.Schema;

        class TestController {
            @Validate(badSchema)
            handle(_req: Request, _res: Response, _next: NextFunction) {}
        }

        const { req, res, next } = mockReqRes({ name: 'Alice' });
        const ctrl = new TestController();
        await ctrl.handle(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(res.status).not.toHaveBeenCalled();
    });

    it('preserves the correct `this` context in the original method', async () => {
        class TestController {
            value = 'hello';
            result = '';

            @Validate(schema)
            handle(_req: Request, _res: Response, _next: NextFunction) {
                this.result = this.value;
            }
        }

        const { req, res, next } = mockReqRes({ name: 'Alice' });
        const ctrl = new TestController();
        await ctrl.handle(req, res, next);

        expect(ctrl.result).toBe('hello');
    });
});
