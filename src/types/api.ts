import { z } from "zod";
import { paths } from "./zod.gen.js";

export type EndpointReturnTypes<E extends keyof typeof paths> =
    E extends UsageEndpoints
    ? UsageResponse["data"]
    : z.infer<(typeof paths)[E]["get"]["responses"]["default"]>;
export type EndpointParameters<E extends keyof typeof paths> = {
    path: z.infer<NonNullable<(typeof paths)[E]["get"]["parameters"]["path"]>>;
    query: z.infer<
        NonNullable<(typeof paths)[E]["get"]["parameters"]["query"]>
    >;
};

// Usage endpoints interacts with the database
export type UsageEndpoints = Exclude<
    keyof typeof paths,
    "/health" | "/metrics" | "/version" | "/openapi"
>;
export type UsageResponse = z.infer<
    (typeof paths)[UsageEndpoints]["get"]["responses"]["default"]
>;

export type ValidUserParams<E extends UsageEndpoints> =
    EndpointParameters<E> extends { path: unknown; query: unknown }
    ? Extract<
        EndpointParameters<E>,
        { query: unknown; path: unknown }
    >["query"] &
    Extract<EndpointParameters<E>, { path: unknown }>["path"]
    :
    | Extract<EndpointParameters<E>, { query: unknown }>["query"]
    | Extract<EndpointParameters<E>, { path: unknown }>["path"];

export type AdditionalQueryParams = {
    offset?: number;
    min_block?: number;
    max_block?: number;
};
// Allow any valid parameters from the endpoint to be used as SQL query parameters with the addition of the `OFFSET` for pagination
export type ValidQueryParams = ValidUserParams<UsageEndpoints> &
    AdditionalQueryParams;
