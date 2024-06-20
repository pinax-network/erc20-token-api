import { DEFAULT_SORT_BY } from "./config.js";
import { getAddress, parseLimit, parseTimestamp, formatTxid } from "./utils.js";
import type { EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";
import { Contract } from "ethers";

export function addBlockFilter(q: any, where: any[]) {
    if (q.block_num) where.push(`block_num <= ${q.block_num}`);
}

export function addBlockRangeFilter(q: any, where: any[]) {

    if (q.block_range && q.block_range != '0') {
        const parts = q.block_range.split(',');
        const block1 = parseInt(parts[0], 10);
        const block2 = parseInt(parts[1], 10);

        if (block1 && block2) where.push(`block_num >= ${block1} AND block_num <= ${block2}`)
        else where.push(`block_num <= ${block1}`)
    };
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
        const table = 'mv_supply_contract'
        const contractTable = 'contracts';
        let query = `SELECT
    ${table}.contract,
        ${table}.supply as supply,
                ${table}.block_num,
                        ${contractTable}.name as name,
                            ${contractTable}.symbol as symbol,
                                ${contractTable}.decimals as decimals,
                                    toUnixTimestamp(${table}.timestamp)*1000 as timestamp
    FROM ${table} `;


        // JOIN Contracts table
        query += ` LEFT JOIN Contracts ON ${contractTable}.contract = ${table}.contract`;
        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (address) where.push(`${table}.contract == '${address}'`);

            // timestamp and block filter
            addBlockFilter(q, where);

            if (symbol) where.push(`LOWER(symbol) == '${symbol}'`);
            if (name) where.push(`LOWER(name) == '${name}'`);


            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            // const sort_by = searchParams.get("sort_by");
            query += ` ORDER BY block_num ${DEFAULT_SORT_BY} `

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
        const table = 'contracts'
        let query = `SELECT  
    ${table}.contract,
    ${table}.name,
    ${table}.symbol,
    ${table}.decimals,
    ${table}.block_num,
    toDateTime(toUnixTimestamp(${table}.timestamp) * 1000) as timestamp 
    FROM ${table} `


        if (!example) {
            // WHERE statements
            const where = [];
            if (address) where.push(`contract == '${address}'`);
            if (symbol) where.push(`LOWER(symbol) == '${symbol}'`);
            if (name) where.push(`LOWER(name) == '${name}'`);


            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            //const sort_by = searchParams.get("sort_by");
            query += ` ORDER BY block_num ${DEFAULT_SORT_BY} `

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
        if (q.account) owner = getAddress(q.account, "account", false)?.toLowerCase();

        let table;
        // SQL Query
        if (contract) table = 'balance_changes_contract_historical_mv';
        else table = "balance_changes_account_historical_mv"

        let query = `SELECT
        owner as account,
        contract,
        new_balance AS balance,
        toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp,
        block_num `
        query += ` FROM ${table}`


        //Join for latest block between block range selected
        const blockfilter: any = [];
        let blockfilterQuery = "";
        addBlockFilter(q, blockfilter);
        if (blockfilter.length) blockfilterQuery += ` WHERE(${blockfilter.join(' AND ')})`;
        let joinSelectQuery = "";

        if (contract) joinSelectQuery = `SELECT owner, MAX(block_num)   FROM (SELECT owner, block_num , contract FROM ${table} ${blockfilterQuery})`;
        else joinSelectQuery = `SELECT contract, owner, MAX(block_num) as block_num  FROM (SELECT owner, block_num , contract FROM ${table} ${blockfilterQuery})`;
        const joinWhereQuery: any = [];
        //add where filter to joinQuery
        if (contract) joinWhereQuery.push(`contract == '${contract}'`);
        joinWhereQuery.push(`owner == '${owner}'`);
        if (joinWhereQuery.length) joinSelectQuery += ` WHERE(${joinWhereQuery.join(' AND ')})`;

        //Add group by to joinQuery
        if (contract) joinSelectQuery += ` GROUP BY owner`
        else joinSelectQuery += ` GROUP BY (owner,contract)`

        if (contract) query += ` JOIN (${joinSelectQuery}) as latest ON ${table}.owner = latest.owner AND ${table}.block_num = latest.block_num`
        else query += ` JOIN (${joinSelectQuery}) as latest ON ${table}.owner = latest.owner AND ${table}.block_num = latest.block_num AND ${table}.contract = latest.contract`


        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            where.push(`account == '${owner}'`)
            where.push(`balance != '0'`);
            if (contract) where.push(`contract == '${contract}'`);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;


            //add ORDER BY and GROUP BY
            query += ` ORDER BY balance DESC`
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
        const table = 'balance_changes_contract_historical_mv'
        let query = `SELECT 
        account,
        new_balance AS balance,
        block_num ,
        toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp
    FROM ${table} `;

        //Join for latest block between block range selected
        const blockfilter: any = [];
        let blockfilterQuery = "";
        addBlockFilter(q, blockfilter);
        if (blockfilter.length) blockfilterQuery += ` WHERE(${blockfilter.join(' AND ')})`;

        let joinSelectQuery = `SELECT account, MAX(block_num)  FROM (SELECT account, block_num ,contract FROM ${table} ${blockfilterQuery})`;
        const joinWhereQuery: any = [];

        //add where filter to joinQuery
        joinWhereQuery.push(`contract == '${contract}'`);
        if (joinWhereQuery.length) joinSelectQuery += ` WHERE(${joinWhereQuery.join(' AND ')})`;

        //Add group by to joinQuery
        joinSelectQuery += ` GROUP BY account`

        query += `JOIN (${joinSelectQuery}) as latest ON ${table}.account = latest.account AND ${table}.block_num = latest.block_num`

        if (!example) {
            // WHERE statements
            const where: any = [];
            if (contract) where.push(`contract == '${contract}'`);
            where.push(`balance != '0'`);

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            //add ORDER BY and GROUP BY
            query += ` ORDER BY balance DESC`
        }

        const limit = parseLimit(q.limit, 100);
        if (limit) query += ` LIMIT ${limit} `;
        const offset = q.page;
        if (offset) query += ` OFFSET ${offset} `


        console.log(query)
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

        if (q.contract) contract = getAddress(q.contract, "contract", false)?.toLowerCase();
        if (q.from) from = getAddress(q.from, "from", false)?.toLowerCase();
        if (q.to) to = getAddress(q.to, "to", false)?.toLowerCase();


        // SQL Query
        let table = "transfers"
        let mvFromTable = "transfers_from_historical_mv"
        let mvToTable = "transfers_to_historical_mv"
        let mvContractTable = "transfers_contract_historical_mv"

        let query = `SELECT
        contract,
        from,
        to,
        value as amount,
        transaction as transaction_id,
        block_num,
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
            if (contract) where.push(`contract == '${contract}'`);
            if (from) where.push(`from == '${from}'`);
            if (to) where.push(`to == '${to}'`);

            // timestamp and block filter
            addBlockRangeFilter(q, where);

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
        const transaction_id = formatTxid(q.transaction_id);


        // SQL Query
        let table = "transfers"

        let query = `SELECT
        contract,
        from,
        to,
        value as amount,
        transaction as transaction_id,
        block_num,
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