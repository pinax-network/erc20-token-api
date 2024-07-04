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
import { fixEndpointParametersCoercion } from "./src/types/api.js";

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

    // Call once
    fixEndpointParametersCoercion();

    const createUsageEndpoint = (endpoint: UsageEndpoints) => app.get(
        // Hono using different syntax than OpenAPI for path parameters
        // `/{path_param}` (OpenAPI) VS `/:path_param` (Hono)
        endpoint.replace(/{([^}]+)}/g, ":$1"),
        async (ctx: Context) => {
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


    createUsageEndpoint("/{chain}/balance");
    createUsageEndpoint("/chains");
    createUsageEndpoint("/{chain}/holders");
    createUsageEndpoint("/{chain}/supply");
    createUsageEndpoint("/{chain}/transfers");
    createUsageEndpoint("/{chain}/transfers/{trx_id}");
    createUsageEndpoint("/{chain}/tokens");
    app.notFound((ctx: Context) => APIErrorResponse(ctx, 404, "route_not_found", `Path not found: ${ctx.req.method} ${ctx.req.path}`));

    return app;
}

export default ERC20TokenAPI();