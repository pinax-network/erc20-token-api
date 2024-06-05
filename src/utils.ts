import { ZodError } from "zod";

import type { Context } from "hono";
import type { APIError } from "./types/zod.gen.js";
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

export function formatTxid(txid: string | null) {
    if (!txid) return undefined;
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