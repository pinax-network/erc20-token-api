import z from "zod";

import type { GetEndpoints } from './zod.gen.js';

export type EndpointReturnTypes<E extends keyof GetEndpoints> = E extends UsageEndpoints ? UsageResponse["data"] : z.infer<GetEndpoints[E]["response"]>;
export type EndpointParameters<E extends keyof GetEndpoints> = z.infer<GetEndpoints[E]["parameters"]>;

// Usage endpoints interacts with the database
export type UsageEndpoints = Exclude<keyof GetEndpoints, "/health" | "/metrics" | "/version" | "/openapi">;
export type UsageResponse = z.infer<GetEndpoints[UsageEndpoints]["response"]>;

export type ValidUserParams<E extends UsageEndpoints> = EndpointParameters<E> extends { path: unknown; } ?
    // Combine path and query parameters only if path exists to prevent "never" on intersection
    Extract<EndpointParameters<E>, { query: unknown; }>["query"] & Extract<EndpointParameters<E>, { path: unknown; }>["path"]
    :
    Extract<EndpointParameters<E>, { query: unknown; }>["query"];
// Allow any valid parameters from the endpoint to be used as SQL query parameters with the addition of the `OFFSET` for pagination
export type ValidQueryParams = ValidUserParams<UsageEndpoints> & { offset?: number; };
