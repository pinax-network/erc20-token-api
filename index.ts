import client from './src/clickhouse/client.js';
import openapi from "./tsp-output/@typespec/openapi3/openapi.json";

import { Hono } from "hono";
import { z } from "zod";
import { paths } from './src/types/zod.gen.js';
import { APP_VERSION } from "./src/config.js";
import { logger } from './src/logger.js';
import * as prometheus from './src/prometheus.js';
import { makeUsageQuery } from "./src/usage.js";
import { APIErrorResponse } from "./src/utils.js";


import type { Context } from "hono";
import type { EndpointParameters, EndpointReturnTypes, UsageEndpoints, ValidQueryParams } from "./src/types/api.js";

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
        endpoint.replace(/{([^}]+)}/g, ":$1"),
        async (ctx: Context) => {

            let resultQuery;
            let resultPath;

            console.log(ctx.req.param())
            if (paths[endpoint]["get"]["parameters"]["path"] != undefined) {

                resultPath = paths[endpoint]["get"]["parameters"]["path"].safeParse(ctx.req.param()) as z.SafeParseSuccess<EndpointParameters<typeof endpoint>["path"]>;
            }

            if (paths[endpoint]["get"]["parameters"]["query"] != undefined) {

                resultQuery = paths[endpoint]["get"]["parameters"]["query"].safeParse(ctx.req.query()) as z.SafeParseSuccess<EndpointParameters<typeof endpoint>["query"]>;
            }


            if ((resultPath == undefined || resultPath.success) && (resultQuery == undefined || resultQuery.success)) {
                console.log("Success")
                return makeUsageQuery(
                    ctx,
                    endpoint,
                    {
                        ...resultQuery?.data,
                        // Path parameters may not always be present
                        ...resultPath?.data
                    } as ValidQueryParams
                );
            } else {
                return APIErrorResponse(ctx, 400, "bad_query_input", resultPath?.error || resultQuery?.error);
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