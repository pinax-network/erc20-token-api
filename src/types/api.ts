import { ZodArray, ZodBigInt, ZodBoolean, ZodDate, ZodDefault, ZodNumber, ZodOptional, ZodType, ZodTypeAny, ZodUndefined, ZodUnion, z } from "zod";

import { EndpointByMethod, type GetEndpoints } from './zod.gen.js';
import { config } from "../config.js";

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
export type AdditionalQueryParams = { offset?: number; min_block?: number; max_block?: number; }
// Allow any valid parameters from the endpoint to be used as SQL query parameters with the addition of the `OFFSET` for pagination
export type ValidQueryParams = ValidUserParams<UsageEndpoints> & AdditionalQueryParams;

export function fixEndpointParametersCoercion() {
    // Add type coercion for query and path parameters since the codegen doesn't coerce types natively
    for (const endpoint in EndpointByMethod["get"]) {
        if (EndpointByMethod["get"][endpoint as UsageEndpoints].parameters.shape) {
            Object.values(EndpointByMethod["get"][endpoint as UsageEndpoints].parameters.shape).map(p => p.shape).forEach(
                // `p` can be query or path parameters
                (p) => Object.keys(p).filter(k => k !== "chain").forEach(
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

                        const coercePrimitive = (zod_type: ZodType) => {
                            if (zod_type instanceof ZodNumber) {
                                return z.coerce.number();
                            } else if (zod_type instanceof ZodBoolean) {
                                return z.coerce.boolean();
                            } else if (zod_type instanceof ZodBigInt) {
                                return z.coerce.bigint();
                            } else if (zod_type instanceof ZodDate) {
                                return z.coerce.date();
                                // Any other type will be coerced as string value directly
                            } else {
                                return z.string();
                            }
                        };

                        if (underlying_zod_type instanceof ZodArray && underlying_zod_type.element instanceof ZodNumber) {
                            // Special case for `block_range` coercion, input is expected to be one or two values separated by comma
                            p[key] = z.preprocess(
                                (x) => String(x).split(','),
                                z.coerce.number().positive().array().min(1).max(2)
                            );
                        } else {
                            p[key] = coercePrimitive(underlying_zod_type);
                        }

                        if (key === "limit")
                            p[key] = p[key].max(config.maxLimit);

                        // Need to mark optional before adding defaults
                        if (isOptional)
                            p[key] = p[key].optional();

                        // Mark parameters with default values explicitly as a workaround
                        // See https://github.com/astahmer/typed-openapi/issues/34
                        if (key === "limit")
                            p[key] = p[key].default(10);
                        else if (key === "page")
                            p[key] = p[key].default(1);

                    }
                )
            );
        }
    }
}