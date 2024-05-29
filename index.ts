import client from './src/clickhouse/client.js';
import openapi from "./tsp-output/@typespec/openapi3/openapi.json";

import { Hono } from "hono";
import { ZodBigInt, ZodBoolean, ZodDate, ZodDefault, ZodNumber, ZodOptional, ZodTypeAny, ZodUndefined, ZodUnion, z } from "zod";
import { EndpointByMethod } from './src/types/zod.gen.js';
import { APP_VERSION } from "./src/config.js";
import { logger } from './src/logger.js';
import * as prometheus from './src/prometheus.js';
import { makeUsageQuery } from "./src/usage.js";
import { APIErrorResponse } from "./src/utils.js";

import type { Context } from "hono";
import type { EndpointParameters, EndpointReturnTypes, UsageEndpoints } from "./src/types/api.js";

function ERC20TokenAPI() {
    const app = new Hono();

    app.use(async (ctx: Context, next) => {
        const pathname = ctx.req.path;
        logger.trace(`Incoming request: [${pathname}]`);
        prometheus.request.inc({ pathname });

        await next();
    });

    app.get(
        "/",
        async (_) => new Response(Bun.file("./swagger/index.html"))
    );

    app.get(
        "/favicon.ico",
        async (_) => new Response(Bun.file("./swagger/favicon.ico"))
    );

    app.get(
        "/openapi",
        async (ctx: Context) => ctx.json<{ [key: string]: EndpointReturnTypes<"/openapi">; }, 200>(openapi)
    );

    app.get(
        "/version",
        async (ctx: Context) => ctx.json<EndpointReturnTypes<"/version">, 200>(APP_VERSION)
    );

    app.get(
        "/health",
        async (ctx: Context) => {
            const response = await client.ping();

            if (!response.success) {
                return APIErrorResponse(ctx, 500, "bad_database_response", response.error.message);
            }

            return new Response("OK");
        }
    );

    app.get(
        "/metrics",
        async (_) => new Response(await prometheus.registry.metrics(), { headers: { "Content-Type": prometheus.registry.contentType } })
    );

    const createUsageEndpoint = (endpoint: UsageEndpoints) => app.get(
        // Hono using different syntax than OpenAPI for path parameters
        // `/{path_param}` (OpenAPI) VS `/:path_param` (Hono)
        endpoint.replace(/{([^}]+)}/, ":$1"),
        async (ctx: Context) => {
            // Add type coercion for query and path parameters since the codegen doesn't coerce types natively
            const endpoint_parameters = Object.values(EndpointByMethod["get"][endpoint].parameters.shape).map(p => p.shape);
            endpoint_parameters.forEach(
                // `p` can be query or path parameters
                (p) => Object.keys(p).forEach(
                    (key, _) => {
                        let zod_type = p[key] as ZodTypeAny;
                        let underlying_zod_type: ZodTypeAny;
                        let isOptional = false;

                        // Strip default layer for value
                        if (zod_type instanceof ZodDefault) {
                            zod_type = zod_type.removeDefault();
                        }

                        // Detect the underlying type from the codegen
                        if (zod_type instanceof ZodUnion) {
                            underlying_zod_type = zod_type.options[0];
                            isOptional = zod_type.options.some((o: ZodTypeAny) => o instanceof ZodUndefined);
                        } else if (zod_type instanceof ZodOptional) {
                            underlying_zod_type = zod_type.unwrap();
                            isOptional = true;
                        } else {
                            underlying_zod_type = zod_type;
                        }

                        // Query and path user input parameters come as strings and we need to coerce them to the right type using Zod
                        if (underlying_zod_type instanceof ZodNumber) {
                            p[key] = z.coerce.number();
                        } else if (underlying_zod_type instanceof ZodBoolean) {
                            p[key] = z.coerce.boolean();
                        } else if (underlying_zod_type instanceof ZodBigInt) {
                            p[key] = z.coerce.bigint();
                        } else if (underlying_zod_type instanceof ZodDate) {
                            p[key] = z.coerce.date();
                            // Any other type will be coerced as string value directly
                        } else {
                            p[key] = z.coerce.string();
                        }

                        if (isOptional)
                            p[key] = p[key].optional();

                        // Mark parameters with default values explicitly as a workaround
                        // See https://github.com/astahmer/typed-openapi/issues/34
                        if (key == "limit")
                            p[key] = p[key].default(10);
                        else if (key == "page")
                            p[key] = p[key].default(1);

                    }
                )
            );

            const result = EndpointByMethod["get"][endpoint].parameters.safeParse({
                query: ctx.req.query(),
                path: ctx.req.param()
            }) as z.SafeParseSuccess<EndpointParameters<typeof endpoint>>;

            if (result.success) {
                return makeUsageQuery(
                    ctx,
                    endpoint,
                    {
                        ...result.data.query,
                        // Path parameters may not always be present
                        ...("path" in result.data ? result.data.path : {})
                    }
                );
            } else {
                return APIErrorResponse(ctx, 400, "bad_query_input", result.error);
            }
        }
    );

    createUsageEndpoint("/balance"); // TODO: Maybe separate `block_num`/`timestamp` queries with path parameters (additional response schemas)
    createUsageEndpoint("/head");
    createUsageEndpoint("/holders");
    createUsageEndpoint("/supply"); // TODO: Same as `balance``
    createUsageEndpoint("/transfers"); // TODO: Redefine `block_range` params
    createUsageEndpoint("/transfers/{transaction_id}");
    createUsageEndpoint("/contract");
    app.notFound((ctx: Context) => APIErrorResponse(ctx, 404, "route_not_found", `Path not found: ${ctx.req.method} ${ctx.req.path}`));

    return app;
}

export default ERC20TokenAPI();