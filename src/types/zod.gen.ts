import { z } from "zod";


export const apiErrorSchema = z.object({ "status": z.union([z.literal(500), z.literal(504), z.literal(400), z.literal(401), z.literal(403), z.literal(404), z.literal(405)]), "code": z.enum(["bad_database_response", "bad_header", "missing_required_header", "bad_query_input", "database_timeout", "forbidden", "internal_server_error", "method_not_allowed", "route_not_found", "unauthorized"]), "message": z.coerce.string() });
export type ApiErrorSchema = z.infer<typeof apiErrorSchema>;


export const balanceChangeSchema = z.object({ "contract": z.coerce.string(), "owner": z.coerce.string(), "amount": z.coerce.string(), "old_balance": z.coerce.string(), "new_balance": z.coerce.string(), "change_type": z.coerce.number(), "block_num": z.coerce.number(), "timestamp": z.coerce.number(), "trx_id": z.coerce.string() });
export type BalanceChangeSchema = z.infer<typeof balanceChangeSchema>;


export const contractSchema = z.object({ "contract": z.coerce.string(), "name": z.coerce.string(), "symbol": z.coerce.string(), "decimals": z.coerce.number(), "block_num": z.coerce.number(), "timestamp": z.coerce.number() });
export type ContractSchema = z.infer<typeof contractSchema>;


export const holderSchema = z.object({ "account": z.coerce.string(), "balance": z.coerce.string() });
export type HolderSchema = z.infer<typeof holderSchema>;


export const paginationSchema = z.object({ "next_page": z.coerce.number(), "previous_page": z.coerce.number(), "total_pages": z.coerce.number(), "total_results": z.coerce.number() });
export type PaginationSchema = z.infer<typeof paginationSchema>;


export const queryStatisticsSchema = z.object({ "elapsed": z.coerce.number(), "rows_read": z.coerce.number(), "bytes_read": z.coerce.number() });
export type QueryStatisticsSchema = z.infer<typeof queryStatisticsSchema>;


export const responseMetadataSchema = z.object({ "statistics": z.lazy(() => queryStatisticsSchema).nullable(), "next_page": z.coerce.number(), "previous_page": z.coerce.number(), "total_pages": z.coerce.number(), "total_results": z.coerce.number() });
export type ResponseMetadataSchema = z.infer<typeof responseMetadataSchema>;


export const supplySchema = z.object({ "contract": z.coerce.string(), "supply": z.coerce.string(), "block_num": z.coerce.number(), "timestamp": z.coerce.number() });
export type SupplySchema = z.infer<typeof supplySchema>;


export const supportedChainsSchema = z.enum(["eth", "polygon"]);
export type SupportedChainsSchema = z.infer<typeof supportedChainsSchema>;


export const transferSchema = z.object({ "contract": z.coerce.string(), "from": z.coerce.string(), "to": z.coerce.string(), "value": z.coerce.string(), "block_num": z.coerce.number(), "timestamp": z.coerce.number(), "trx_id": z.coerce.string(), "action_index": z.coerce.number() });
export type TransferSchema = z.infer<typeof transferSchema>;

 /**
 * @description Contact information for the exposed API.
 */
export const typeSpecOpenApiContactSchema = z.object({ "name": z.coerce.string().describe("The identifying name of the contact person/organization.").optional(), "url": z.coerce.string().url().describe("The URL pointing to the contact information. MUST be in the format of a URL.").optional(), "email": z.coerce.string().describe("The email address of the contact person/organization. MUST be in the format of an email address.").optional() }).describe("Contact information for the exposed API.");
export type TypeSpecOpenApiContactSchema = z.infer<typeof typeSpecOpenApiContactSchema>;


export const versionSchema = z.object({ "version": z.coerce.string().regex(new RegExp("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$")), "commit": z.coerce.string().regex(new RegExp("^[0-9a-f]{7}$")) });
export type VersionSchema = z.infer<typeof versionSchema>;


export const usageChainsQueryParamsSchema = z.object({ "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() }).optional();
export type UsageChainsQueryParamsSchema = z.infer<typeof usageChainsQueryParamsSchema>;
/**
 * @description Array of block information.
 */
export const usageChains200Schema = z.object({ "data": z.array(z.object({ "chain": z.lazy(() => supportedChainsSchema), "block_num": z.coerce.number() })), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageChains200Schema = z.infer<typeof usageChains200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageChainsErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageChainsErrorSchema = z.infer<typeof usageChainsErrorSchema>;
/**
 * @description Array of block information.
 */
export const usageChainsQueryResponseSchema = z.object({ "data": z.array(z.object({ "chain": z.lazy(() => supportedChainsSchema), "block_num": z.coerce.number() })), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageChainsQueryResponseSchema = z.infer<typeof usageChainsQueryResponseSchema>;

 /**
 * @description OK or APIError.
 */
export const monitoringHealth200Schema = z.coerce.string();
export type MonitoringHealth200Schema = z.infer<typeof monitoringHealth200Schema>;
/**
 * @description An unexpected error response.
 */
export const monitoringHealthErrorSchema = z.lazy(() => apiErrorSchema);
export type MonitoringHealthErrorSchema = z.infer<typeof monitoringHealthErrorSchema>;
/**
 * @description OK or APIError.
 */
export const monitoringHealthQueryResponseSchema = z.coerce.string();
export type MonitoringHealthQueryResponseSchema = z.infer<typeof monitoringHealthQueryResponseSchema>;

 /**
 * @description Metrics as text.
 */
export const monitoringMetrics200Schema = z.coerce.string();
export type MonitoringMetrics200Schema = z.infer<typeof monitoringMetrics200Schema>;
/**
 * @description Metrics as text.
 */
export const monitoringMetricsQueryResponseSchema = z.coerce.string();
export type MonitoringMetricsQueryResponseSchema = z.infer<typeof monitoringMetricsQueryResponseSchema>;

 /**
 * @description The OpenAPI JSON spec
 */
export const docsOpenapi200Schema = z.object({});
export type DocsOpenapi200Schema = z.infer<typeof docsOpenapi200Schema>;
/**
 * @description An unexpected error response.
 */
export const docsOpenapiErrorSchema = z.lazy(() => apiErrorSchema);
export type DocsOpenapiErrorSchema = z.infer<typeof docsOpenapiErrorSchema>;
/**
 * @description The OpenAPI JSON spec
 */
export const docsOpenapiQueryResponseSchema = z.object({});
export type DocsOpenapiQueryResponseSchema = z.infer<typeof docsOpenapiQueryResponseSchema>;

 /**
 * @description The API version and commit hash.
 */
export const docsVersion200Schema = z.lazy(() => versionSchema);
export type DocsVersion200Schema = z.infer<typeof docsVersion200Schema>;
/**
 * @description An unexpected error response.
 */
export const docsVersionErrorSchema = z.lazy(() => apiErrorSchema);
export type DocsVersionErrorSchema = z.infer<typeof docsVersionErrorSchema>;
/**
 * @description The API version and commit hash.
 */
export const docsVersionQueryResponseSchema = z.lazy(() => versionSchema);
export type DocsVersionQueryResponseSchema = z.infer<typeof docsVersionQueryResponseSchema>;


export const usageBalancePathParamsSchema = z.object({ "chain": z.lazy(() => supportedChainsSchema) });
export type UsageBalancePathParamsSchema = z.infer<typeof usageBalancePathParamsSchema>;

 export const usageBalanceQueryParamsSchema = z.object({ "contract": z.coerce.string().optional(), "account": z.coerce.string(), "block_num": z.coerce.number().optional(), "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() });
export type UsageBalanceQueryParamsSchema = z.infer<typeof usageBalanceQueryParamsSchema>;
/**
 * @description Array of balances.
 */
export const usageBalance200Schema = z.object({ "data": z.array(z.lazy(() => balanceChangeSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageBalance200Schema = z.infer<typeof usageBalance200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageBalanceErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageBalanceErrorSchema = z.infer<typeof usageBalanceErrorSchema>;
/**
 * @description Array of balances.
 */
export const usageBalanceQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => balanceChangeSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageBalanceQueryResponseSchema = z.infer<typeof usageBalanceQueryResponseSchema>;


export const usageHoldersPathParamsSchema = z.object({ "chain": z.lazy(() => supportedChainsSchema) });
export type UsageHoldersPathParamsSchema = z.infer<typeof usageHoldersPathParamsSchema>;

 export const usageHoldersQueryParamsSchema = z.object({ "contract": z.coerce.string(), "block_num": z.coerce.number().optional(), "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() });
export type UsageHoldersQueryParamsSchema = z.infer<typeof usageHoldersQueryParamsSchema>;
/**
 * @description Array of accounts.
 */
export const usageHolders200Schema = z.object({ "data": z.array(z.lazy(() => holderSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageHolders200Schema = z.infer<typeof usageHolders200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageHoldersErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageHoldersErrorSchema = z.infer<typeof usageHoldersErrorSchema>;
/**
 * @description Array of accounts.
 */
export const usageHoldersQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => holderSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageHoldersQueryResponseSchema = z.infer<typeof usageHoldersQueryResponseSchema>;


export const usageSupplyPathParamsSchema = z.object({ "chain": z.lazy(() => supportedChainsSchema) });
export type UsageSupplyPathParamsSchema = z.infer<typeof usageSupplyPathParamsSchema>;

 export const usageSupplyQueryParamsSchema = z.object({ "contract": z.coerce.string(), "block_num": z.coerce.number().optional(), "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() });
export type UsageSupplyQueryParamsSchema = z.infer<typeof usageSupplyQueryParamsSchema>;
/**
 * @description Array of supplies.
 */
export const usageSupply200Schema = z.object({ "data": z.array(z.lazy(() => supplySchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageSupply200Schema = z.infer<typeof usageSupply200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageSupplyErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageSupplyErrorSchema = z.infer<typeof usageSupplyErrorSchema>;
/**
 * @description Array of supplies.
 */
export const usageSupplyQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => supplySchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageSupplyQueryResponseSchema = z.infer<typeof usageSupplyQueryResponseSchema>;


export const usageTokensPathParamsSchema = z.object({ "chain": z.lazy(() => supportedChainsSchema) });
export type UsageTokensPathParamsSchema = z.infer<typeof usageTokensPathParamsSchema>;

 export const usageTokensQueryParamsSchema = z.object({ "contract": z.coerce.string().optional(), "symbol": z.coerce.string().optional(), "name": z.coerce.string().optional(), "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() }).optional();
export type UsageTokensQueryParamsSchema = z.infer<typeof usageTokensQueryParamsSchema>;
/**
 * @description One contract.
 */
export const usageTokens200Schema = z.object({ "data": z.lazy(() => typeSpecOpenApiContactSchema), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTokens200Schema = z.infer<typeof usageTokens200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTokensErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTokensErrorSchema = z.infer<typeof usageTokensErrorSchema>;
/**
 * @description One contract.
 */
export const usageTokensQueryResponseSchema = z.object({ "data": z.lazy(() => typeSpecOpenApiContactSchema), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTokensQueryResponseSchema = z.infer<typeof usageTokensQueryResponseSchema>;


export const usageTransfersPathParamsSchema = z.object({ "chain": z.lazy(() => supportedChainsSchema) });
export type UsageTransfersPathParamsSchema = z.infer<typeof usageTransfersPathParamsSchema>;

 export const usageTransfersQueryParamsSchema = z.object({ "from": z.coerce.string().optional(), "to": z.coerce.string().optional(), "contract": z.coerce.string().optional(), "block_range": z.array(z.coerce.number()).optional(), "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() }).optional();
export type UsageTransfersQueryParamsSchema = z.infer<typeof usageTransfersQueryParamsSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfers200Schema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfers200Schema = z.infer<typeof usageTransfers200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTransfersErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTransfersErrorSchema = z.infer<typeof usageTransfersErrorSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfersQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfersQueryResponseSchema = z.infer<typeof usageTransfersQueryResponseSchema>;


export const usageTransferPathParamsSchema = z.object({ "chain": z.lazy(() => supportedChainsSchema), "trx_id": z.coerce.string() });
export type UsageTransferPathParamsSchema = z.infer<typeof usageTransferPathParamsSchema>;

 export const usageTransferQueryParamsSchema = z.object({ "limit": z.coerce.number().optional(), "page": z.coerce.number().optional() }).optional();
export type UsageTransferQueryParamsSchema = z.infer<typeof usageTransferQueryParamsSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransfer200Schema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransfer200Schema = z.infer<typeof usageTransfer200Schema>;
/**
 * @description An unexpected error response.
 */
export const usageTransferErrorSchema = z.lazy(() => apiErrorSchema);
export type UsageTransferErrorSchema = z.infer<typeof usageTransferErrorSchema>;
/**
 * @description Array of transfers.
 */
export const usageTransferQueryResponseSchema = z.object({ "data": z.array(z.lazy(() => transferSchema)), "meta": z.lazy(() => responseMetadataSchema) });
export type UsageTransferQueryResponseSchema = z.infer<typeof usageTransferQueryResponseSchema>;

 export const operations = { "Usage_chains": {
        request: undefined,
        parameters: {
            path: undefined,
            query: usageChainsQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageChainsQueryResponseSchema,
            default: usageChainsQueryResponseSchema
        },
        errors: {}
    }, "Monitoring_health": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: monitoringHealthQueryResponseSchema,
            default: monitoringHealthQueryResponseSchema
        },
        errors: {}
    }, "Monitoring_metrics": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: monitoringMetricsQueryResponseSchema,
            default: monitoringMetricsQueryResponseSchema
        },
        errors: {}
    }, "Docs_openapi": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: docsOpenapiQueryResponseSchema,
            default: docsOpenapiQueryResponseSchema
        },
        errors: {}
    }, "Docs_version": {
        request: undefined,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            200: docsVersionQueryResponseSchema,
            default: docsVersionQueryResponseSchema
        },
        errors: {}
    }, "Usage_balance": {
        request: undefined,
        parameters: {
            path: usageBalancePathParamsSchema,
            query: usageBalanceQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageBalanceQueryResponseSchema,
            default: usageBalanceQueryResponseSchema
        },
        errors: {}
    }, "Usage_holders": {
        request: undefined,
        parameters: {
            path: usageHoldersPathParamsSchema,
            query: usageHoldersQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageHoldersQueryResponseSchema,
            default: usageHoldersQueryResponseSchema
        },
        errors: {}
    }, "Usage_supply": {
        request: undefined,
        parameters: {
            path: usageSupplyPathParamsSchema,
            query: usageSupplyQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageSupplyQueryResponseSchema,
            default: usageSupplyQueryResponseSchema
        },
        errors: {}
    }, "Usage_tokens": {
        request: undefined,
        parameters: {
            path: usageTokensPathParamsSchema,
            query: usageTokensQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTokensQueryResponseSchema,
            default: usageTokensQueryResponseSchema
        },
        errors: {}
    }, "Usage_transfers": {
        request: undefined,
        parameters: {
            path: usageTransfersPathParamsSchema,
            query: usageTransfersQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTransfersQueryResponseSchema,
            default: usageTransfersQueryResponseSchema
        },
        errors: {}
    }, "Usage_transfer": {
        request: undefined,
        parameters: {
            path: usageTransferPathParamsSchema,
            query: usageTransferQueryParamsSchema,
            header: undefined
        },
        responses: {
            200: usageTransferQueryResponseSchema,
            default: usageTransferQueryResponseSchema
        },
        errors: {}
    } } as const;
export const paths = { "/chains": {
        get: operations["Usage_chains"]
    }, "/health": {
        get: operations["Monitoring_health"]
    }, "/metrics": {
        get: operations["Monitoring_metrics"]
    }, "/openapi": {
        get: operations["Docs_openapi"]
    }, "/version": {
        get: operations["Docs_version"]
    }, "/{chain}/balance": {
        get: operations["Usage_balance"]
    }, "/{chain}/holders": {
        get: operations["Usage_holders"]
    }, "/{chain}/supply": {
        get: operations["Usage_supply"]
    }, "/{chain}/tokens": {
        get: operations["Usage_tokens"]
    }, "/{chain}/transfers": {
        get: operations["Usage_transfers"]
    }, "/{chain}/transfers/{trx_id}": {
        get: operations["Usage_transfer"]
    } } as const;