import { makeQuery } from "./clickhouse/makeQuery.js";
import { APIErrorResponse } from "./utils.js";
import { getBalanceChanges, getContracts, getTotalSupply, getHolders, getTransfer, getTransfers, getChains } from "./queries.js"
import type { Context } from "hono";
import type { EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";

export async function makeUsageQuery(ctx: Context, endpoint: UsageEndpoints, user_params: ValidUserParams<typeof endpoint>) {
    type EndpointElementReturnType = EndpointReturnTypes<typeof endpoint>;

    let { page, ...query_params } = user_params;
    if (!query_params.limit)
        query_params.limit = 10;

    if (!page)
        page = 1;

    let query = "";



    switch (endpoint) {
        case "/{chain}/balance": query = getBalanceChanges(endpoint, query_params); break;
        case "/{chain}/supply": query = getTotalSupply(endpoint, query_params); break;
        case "/{chain}/transfers": query = getTransfers(endpoint, query_params); break;
        case "/{chain}/holders": query = getHolders(endpoint, query_params); break;
        case "/chains": query = getChains(); break;
        case "/{chain}/transfers/{tx_id}": query = getTransfer(endpoint, query_params); break;
        case "/{chain}/tokens": query = getContracts(endpoint, query_params); break;
    }

    //choose Chain

    let finalquery
    if (endpoint != '/chains') {
        const q = query_params as ValidUserParams<typeof endpoint>;
        finalquery = `USE ${q.chain}_erc20_token; ${query}`
    }
    let query_results;
    try {
        query_results = await makeQuery<EndpointElementReturnType>(query, { ...query_params, offset: query_params.limit * (page - 1) });
    } catch (err) {
        return APIErrorResponse(ctx, 500, "bad_database_response", err);
    }

    // Always have a least one total page
    const total_pages = Math.max(Math.ceil((query_results.rows_before_limit_at_least ?? 0) / query_params.limit), 1);

    if (page > total_pages)
        return APIErrorResponse(ctx, 400, "bad_query_input", `Requested page (${page}) exceeds total pages (${total_pages})`);

    /* Solving the `data` type issue:
    type A = string[] | number[]; // This is union of array types
    type B = A[number][]; // This is array of elements of union type

    let t: A;
    let v: B;

    t = v; // Error
    */

    return ctx.json<UsageResponse, 200>({
        // @ts-ignore        
        data: query_results.data,
        meta: {
            statistics: query_results.statistics ?? null,
            next_page: (page * query_params.limit >= (query_results.rows_before_limit_at_least ?? 0)) ? page : page + 1,
            previous_page: (page <= 1) ? page : page - 1,
            total_pages,
            total_results: query_results.rows_before_limit_at_least ?? 0
        }
    });
}

