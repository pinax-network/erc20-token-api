import { makeQuery } from "./clickhouse/makeQuery.js";
import { APIErrorResponse, formatQueryParams } from "./utils.js";
import { getBalanceChanges, getContracts, getTotalSupply, getHolders, getTransfer, getTransfers, getChains } from "./queries.js"
import type { Context } from "hono";
import type { EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";

export async function makeUsageQuery(ctx: Context, endpoint: UsageEndpoints, user_params: ValidUserParams<typeof endpoint>) {
    type EndpointElementReturnType = EndpointReturnTypes<typeof endpoint>;

    let page;
    if (user_params && "page" in user_params) page = user_params.page;

    let limit = 100;
    if (user_params && "limit" in user_params && user_params.limit) limit = user_params.limit;

    let offset = 0;
    if (user_params && "page" in user_params && user_params.page) offset = user_params.limit ? user_params.page * user_params.limit : 0;


    if (!page)
        page = 1;

    let query = "";
    let additional_query_params = {};

    try {
        user_params = formatQueryParams(user_params);
    }
    catch (err) {
        return APIErrorResponse(ctx, 400, "bad_query_input", err);
    }

    switch (endpoint) {
        case "/{chain}/balance": ({ query, additional_query_params } = getBalanceChanges(endpoint, user_params)); break;
        case "/{chain}/supply": ({ query, additional_query_params } = getTotalSupply(endpoint, user_params)); break;
        case "/{chain}/transfers": query = getTransfers(endpoint, user_params); break;
        case "/{chain}/holders": ({ query, additional_query_params } = getHolders(endpoint, user_params)); break;
        case "/chains": query = getChains(); break;
        case "/{chain}/transfers/{trx_id}": query = getTransfer(endpoint, user_params); break;
        case "/{chain}/tokens": query = getContracts(endpoint, user_params); break;
    }

    let query_results;

    try {
        query_results = await makeQuery<EndpointElementReturnType>(query, { ...user_params, ...additional_query_params, limit, offset });
    } catch (err) {
        return APIErrorResponse(ctx, 500, "bad_database_response", err);
    }

    // Always have a least one total page
    const total_pages = Math.max(Math.ceil((query_results.rows_before_limit_at_least ?? 0) / limit), 1);

    if (page > total_pages)
        return APIErrorResponse(ctx, 400, "bad_query_input", `Requested page (${page}) exceeds total pages (${total_pages})`);

    return ctx.json<UsageResponse, 200>({
        // @ts-ignore        
        data: query_results.data,
        meta: {
            statistics: query_results.statistics ?? null,
            next_page: (page * limit >= (query_results.rows_before_limit_at_least ?? 0)) ? page : page + 1,
            previous_page: (page <= 1) ? page : page - 1,
            total_pages,
            total_results: query_results.rows_before_limit_at_least ?? 0
        }
    });
}

