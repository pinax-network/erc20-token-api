import { DEFAULT_SORT_BY } from "./config.js";
import { getAddress, parseLimit, parseTimestamp } from "./utils.js";
import type { EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";
import { Contract } from "ethers";


export function addTimestampBlockFilter(q: any, where: any[]) {
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
    ]
    for (const [key, operator] of operators) {
        const block_number = q[`${key}_by_block`];
        const timestamp = q[`${key}_by_timestamp`];
        if (block_number) where.push(`block_number ${operator} ${block_number}`);
        if (timestamp) where.push(`toUnixTimestamp(timestamp) ${operator} ${timestamp}`);
    }
}

export function addAmountFilter(q: any, where: any[]) {
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
    ]
    for (const [key, operator] of operators) {
        const amount = q[`amount_${key}`];
        if (amount) where.push(`amount ${operator} ${amount}`);
    }
}


function balance_changes_owner_contract_query(table: string) {
    let query = `SELECT
    contract as contract,
    owner as owner,
    new_balance as balance,
    toDateTime(toUnixTimestamp(timestamp)*1000) as timestamp,
    transaction_id,
    block_num as block_number,`;

    query += ` FROM ${table}`
    return query;
}

function balance_changes_owner_query(table: string) {
    let query = `SELECT
    owner,
    contract,
    toDateTime(toUnixTimestamp(last_value(timestamp))*1000) AS timestamp,
    last_value(new_balance) AS balance`;

    query += ` FROM ${table}`
    return query;
}

function balance_changes_contract_query(table: string) {
    let query = `SELECT
    owner,
    contract,
    toDateTime(toUnixTimestamp(last_value(timestamp))*1000) AS timestamp,
    last_value(new_balance) as balance`;

    query += ` FROM ${table}`
    return query;
}









export function getTotalSupply(endpoint: UsageEndpoints, query_param: any, example?: boolean) {

    if (endpoint === "/supply") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let address;
        let symbol;
        let name;
        if (q.contract) address = getAddress(q.contract, "contract", false)?.toLowerCase();
        // const chain = searchParams.get("chain");
        symbol = q.symbol?.toLowerCase();
        name = q.name?.toLowerCase();

        // Query
        const table = 'TotalSupply'
        const contractTable = 'Contracts';
        let query = `SELECT
    ${table}.address as address,
        ${table}.supply as supply,
                ${table}.block_number,
                        ${contractTable}.name as name,
                            ${contractTable}.symbol as symbol,
                                ${contractTable}.decimals as decimals,
                                    toUnixTimestamp(${table}.timestamp)*1000 as timestamp
    FROM ${table} `;


        // JOIN Contracts table
        query += ` LEFT JOIN Contracts ON ${contractTable}.address = ${table}.address`;
        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (address) where.push(`${table}.address == '${address}'`);

            // timestamp and block filter
            addTimestampBlockFilter(q, where);

            if (symbol) where.push(`LOWER(symbol) == '${symbol}'`);
            if (name) where.push(`LOWER(name) == '${name}'`);


            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            // const sort_by = searchParams.get("sort_by");
            query += ` ORDER BY block_number ${DEFAULT_SORT_BY} `

        }
        const limit = parseLimit(q.limit);
        query += ` LIMIT ${limit} `
        const offset = q.page;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }
}



export function getContracts(endpoint: UsageEndpoints, query_param: any, example?: boolean) {
    if (endpoint === "/contract") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        // Params
        //const chain = searchParams.get("chain");
        let address;
        let symbol;
        let name;

        if (q.contract) address = getAddress(q.contract, "contract", false)?.toLowerCase();
        if (q.symbol) symbol = q.symbol?.toLowerCase();
        if (q.name) name = q.name?.toLowerCase();

        // Query
        const table = 'Contracts'
        let query = `SELECT  
    ${table}.address,
    ${table}.name,
    ${table}.symbol,
    ${table}.decimals,
    ${table}.block_number,
    toDateTime(toUnixTimestamp(${table}.timestamp) * 1000) as timestamp 
    FROM ${table} `


        if (!example) {
            // WHERE statements
            const where = [];
            if (address) where.push(`address == '${address}'`);
            if (symbol) where.push(`LOWER(symbol) == '${symbol}'`);
            if (name) where.push(`LOWER(name) == '${name}'`);

            // timestamp and block filter
            addTimestampBlockFilter(q, where);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            //const sort_by = searchParams.get("sort_by");
            query += ` ORDER BY block_number ${DEFAULT_SORT_BY} `

        }
        const limit = parseLimit(q.limit);
        query += ` LIMIT ${limit} `
        const offset = q.page;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }
}

export function getBalanceChanges(endpoint: UsageEndpoints, query_param: any, example?: boolean) {

    if (endpoint === "/balance") {
        const q = query_param as ValidUserParams<typeof endpoint>;


        //const chain = searchParams.get("chain");
        let contract;
        let owner;
        if (q.contract) contract = getAddress(q.contract, "contract", false)?.toLowerCase();
        if (q.account) owner = getAddress(q.account, "owner", false)?.toLowerCase();

        let table;
        let mvOwnerTable = "mv_balance_changes_owner"
        let mvContractTable = "mv_balance_changes_contract"
        let query = "";

        // SQL Query
        table = 'balance_changes'


        if (contract && owner) query += balance_changes_owner_contract_query(mvOwnerTable);
        else if (!contract && owner) query += balance_changes_owner_query(mvContractTable);
        else if (contract && !owner) query += balance_changes_contract_query(mvContractTable);
        else query += `SELECT 
        block_num as block_number,
        toDateTime(toUnixTimestamp(timestamp)*1000) as timestamp,
        contract,
        owner,
        amount,
        old_balance,
        new_balance,
        transaction_id,
        change_type 
    
        FROM ${table}`
        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (owner) where.push(`owner == '${owner}'`);
            if (contract) where.push(`contract == '${contract}'`);

            // timestamp and block filter
            addTimestampBlockFilter(q, where);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;


            //add ORDER BY and GROUP BY
            if (contract && owner) query += ` ORDER BY timestamp DESC`
            if (!contract && owner) query += `GROUP BY (contract, owner) ORDER BY timestamp DESC`
            if (contract && !owner) query += `GROUP BY (contract, owner) ORDER BY timestamp DESC`
        }

        //ADD limit
        const limit = parseLimit(q.limit);
        query += ` LIMIT ${limit} `
        const offset = q.page;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }


}


export function getHolders(endpoint: UsageEndpoints, query_param: any, example?: boolean) {


    if (endpoint === "/holders") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        const contract = getAddress(q.contract, "contract", false)?.toLowerCase();
        // SQL Query
        const table = 'mv_balance_changes_contract'
        let query = `SELECT
    owner,
        new_balance AS balance,
        block_num as block_number,
        toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp
    FROM ${table} `;
        if (!example) {
            // WHERE statements
            const where: any = [];
            if (contract) where.push(`contract == '${contract}'`);
            where.push(`CAST(balance as int) > 0`);

            // timestamp and block filter
            addTimestampBlockFilter(q, where);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            //add ORDER BY and GROUP BY
            query += `ORDER BY timestamp DESC`
        }

        const limit = parseLimit(q.limit, 100);
        if (limit) query += ` LIMIT ${limit} `;
        const offset = q.page;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }
}

export function getTransfers(endpoint: UsageEndpoints, query_param: any, example?: boolean) {


    if (endpoint === "/transfers") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract;
        let from;
        let to;

        if (q.address) contract = getAddress(q.address, "contract", false)?.toLowerCase();
        if (q.from) from = getAddress(q.from, "from", false)?.toLowerCase();
        if (q.to) to = getAddress(q.to, "to", false)?.toLowerCase();


        // SQL Query
        let table = "Transfers"
        let mvFromTable = "mv_transfers_from"
        let mvToTable = "mv_transfers_to"
        let mvContractTable = "mv_transfers_contract"

        let query = `SELECT
        address,
        from,
        to,
        value as amount,
        transaction as transaction_id,
        block_number,
        toDateTime(toUnixTimestamp(timestamp)*1000) as timestamp`

        if (contract) query += ` FROM ${mvContractTable}`
        else if (!contract && from && !to) query += ` FROM ${mvFromTable}`
        else if (!contract && !from && to) query += ` FROM ${mvToTable}`
        else if (!contract && from && to) query += ` FROM ${mvFromTable}`
        else query += ` FROM ${table}`

        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (contract) where.push(`address == '${contract}'`);
            if (from) where.push(`from == '${from}'`);
            if (to) where.push(`to == '${to}'`);

            //add amount filter
            addAmountFilter(q, where);
            // timestamp and block filter
            addTimestampBlockFilter(q, where);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;
            //add ORDER BY and GROUP BY
            query += ` ORDER BY timestamp DESC`
        }

        //ADD limit
        const limit = parseLimit(q.limit, 100);
        query += ` LIMIT ${limit} `
        const offset = q.page;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }
}


export function getTransfer(endpoint: UsageEndpoints, query_param: any, example?: boolean) {


    if (endpoint === "/transfers/{transaction_id}") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract;
        let from;
        let to;

        //  const chain = searchParams.get("chain");
        const transaction_id = q.transaction_id?.toLowerCase();


        // SQL Query
        let table = "Transfers"

        let query = `SELECT
        address,
        from,
        to,
        value as amount,
        transaction as transaction_id,
        block_number,
        toDateTime(toUnixTimestamp(timestamp)*1000) as timestamp`

        query += ` FROM ${table}`

        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (transaction_id) where.push(`transaction == '${transaction_id}'`);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;
            //add ORDER BY and GROUP BY
            query += ` ORDER BY timestamp DESC`
        }
        return query;
    }
    else {
        return ""
    }
}

export function getChain() {
    return `ETH`;
}