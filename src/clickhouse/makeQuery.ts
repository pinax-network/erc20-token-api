import client from "./client.js";

import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";

import type { ResponseJSON } from "@clickhouse/client-web";
import type { ValidQueryParams } from "../types/api.js";

export async function makeQuery<T = unknown>(query: string, query_params: ValidQueryParams) {
    logger.trace({ query, query_params });

    const response = await client.query({ query, query_params, format: "JSON" });
    const data: ResponseJSON<T> = await response.json();

    prometheus.query.inc();
    if ( data.statistics ) {
        prometheus.bytes_read.inc(data.statistics.bytes_read);
        prometheus.rows_read.inc(data.statistics.rows_read);
        prometheus.elapsed.inc(data.statistics.elapsed);
    }

    logger.trace({ statistics: data.statistics, rows: data.rows, rows_before_limit_at_least: data.rows_before_limit_at_least });
    
    return data;
}