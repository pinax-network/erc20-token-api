import { ZodError } from "zod";

import type { Context } from "hono";
import type { ApiErrorSchema as APIError } from "./types/zod.gen.js";
import { logger } from "./logger.js";
import * as prometheus from "./prometheus.js";
import { ethers } from "ethers";
import { config } from "./config.js";

export function APIErrorResponse(ctx: Context, status: APIError["status"], code: APIError["code"], err: unknown) {
    let message = "An unexpected error occured";

    if (typeof err === "string") {
        message = err;
    } else if (err instanceof ZodError) {
        message = err.issues.map(issue => `[${issue.code}] ${issue.path.join('/')}: ${issue.message}`).join('\n');
    } else if (err instanceof Error) {
        message = err.message;
    }

    const api_error = {
        status,
        code,
        message
    };

    logger.error(api_error);
    prometheus.request_error.inc({ pathname: ctx.req.path, status });

    return ctx.json<APIError, typeof status>(api_error, status);
}

export function getAddress(address: string, key: string, required: boolean = false) {
    if (required && !address) throw new Error(`Missing [${key}] parameter`);
    if (address) checkValidAddress(address);
    return formatAddress(address);
}



export function formatQueryParams(query_params: any) {

    if(query_params.limit) query_params.limit = parseLimit(query_params.limit); else query_params.limit = 1;
    if (query_params.trx_id) query_params.trx_id = formatTxid(query_params.trx_id);
    if (query_params.from) query_params.from = getAddress(query_params.from, "from", false)?.toLowerCase();
    if (query_params.to) query_params.to = getAddress(query_params.to, "to", false)?.toLowerCase();
    if (query_params.account) query_params.account = getAddress(query_params.account, "account", false)?.toLowerCase();
    if (query_params.page) query_params.page = query_params.page * query_params.limit;
    if (query_params.contract) query_params.contract = getAddress(query_params.contract, "contract", false)?.toLowerCase();
    if (query_params.name) query_params.name = query_params.name.toLowerCase();
    if (query_params.symbol) query_params.symbol = query_params.symbol.toLowerCase();
    return query_params;
}


export function formatAddress(address: string | null) {
    if (!address) return undefined;
    if (address.startsWith("0x")) {
        // Remove the "0x" prefix and return the address
        return address.slice(2);
    }
    // If it doesn't start with "0x", return the address as is
    return address;
}

export function checkValidAddress(address?: string) {
    if (!ethers.isAddress(address)) throw new Error("Invalid address");
}

// Function to verify transaction hash format
function isValidTransactionHashFormat(txHash: string) {
    // Check if the hash has '0x' prefix
    if (txHash.startsWith('0x')) {
        return /^0x([A-Fa-f0-9]{64})$/.test(txHash);
    } else {
        return /^[A-Fa-f0-9]{64}$/.test(txHash);
    }
}
export function formatTxid(txid: string | null) {
    console.log("test", txid)
    if (!txid) return undefined;
    if (!isValidTransactionHashFormat(txid)) {
        console.log("invalid", txid)
        throw new Error("Invalid trx_id");
        return undefined
    }
    console.log("Valid", txid)
    if (txid.startsWith("0x")) {
        // Remove the "0x" prefix and return the address
        return txid.slice(2).toLowerCase();
    }
    // If it doesn't start with "0x", return the address as is
    return txid.toLowerCase();
}

export function parseLimit(limit?: string | null | number, defaultLimit?: number) {
    let value = 1 // default 1
    if (defaultLimit)
        value = defaultLimit;
    if (limit) {
        if (typeof limit === "string") value = parseInt(limit);
        if (typeof limit === "number") value = limit;
    }
    // limit must be between 1 and maxLimit
    if (value > config.maxLimit) value = config.maxLimit;
    return value;
}

export function parseBlockId(block_id?: string | null) {
    return block_id ? block_id.replace("0x", "") : undefined;
}

export function parseTimestamp(timestamp?: string | null | number) {
    if (timestamp !== undefined && timestamp !== null) {
        if (typeof timestamp === "string") {
            if (/^[0-9]+$/.test(timestamp)) {
                return parseTimestamp(parseInt(timestamp));
            }
            // append "Z" to timestamp if it doesn't have it
            if (!timestamp.endsWith("Z")) timestamp += "Z";
            return Math.floor(Number(new Date(timestamp)) / 1000);
        }
        if (typeof timestamp === "number") {
            const length = timestamp.toString().length;
            if (length === 10) return timestamp; // seconds
            if (length === 13) return Math.floor(timestamp / 1000); // convert milliseconds to seconds
            throw new Error("Invalid timestamp");
        }
    }
    return undefined;
}