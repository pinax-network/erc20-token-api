import { DEFAULT_SORT_BY } from "./config.js";
import { getAddress, parseLimit, parseTimestamp, formatTxid } from "./utils.js";
import type { EndpointReturnTypes, UsageEndpoints, UsageResponse, ValidUserParams } from "./types/api.js";
import { Contract } from "ethers";
import { SupportedChains } from "./types/zod.gen.js";

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


export function getChains() {


    //ADD more chains if needed
    let supportedChain = ['eth', 'polygon'];
    let queries = [];

    // Use a for loop to iterate over each item
    for (const chain of supportedChain) {
        queries.push(`SELECT '${chain}' as chain, MIN(block_num) as block_num FROM ${chain}_erc20_token.cursors`)
    }

    let query = queries.join(' UNION ALL ');
    return query;
}


export function getTotalSupply(endpoint: UsageEndpoints, query_param: any, example?: boolean) {

    if (endpoint === "/{chain}/supply") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let address;
        let symbol;
        let name;
        if (q.contract) address = getAddress(q.contract, "contract", false)?.toLowerCase();
        // const chain = searchParams.get("chain");
        symbol = q.symbol?.toLowerCase();
        name = q.name?.toLowerCase();

        // Query
        const table = `${q.chain}_erc20_token.mv_supply_contract`
        const contractTable = `${q.chain}_erc20_token.contracts`;
        let query = `SELECT
        ${table}.contract,
        ${table}.supply as supply,
        ${table}.block_num,
        ${contractTable}.name as name,
        ${contractTable}.symbol as symbol,
        ${contractTable}.decimals as precision,
        toUnixTimestamp(${table}.timestamp)*1000 as timestamp
    FROM ${table} `;



        // JOIN Contracts table
        query += ` LEFT JOIN ${contractTable} ON ${contractTable}.contract = ${table}.contract`;
        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (address) where.push(`${table}.contract ='${address}'`);

            // timestamp and block filter
            addBlockFilter(q, where);

            if (symbol) where.push(`LOWER(symbol) = '${symbol}'`);
            if (name) where.push(`LOWER(name) = '${name}'`);


            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            // const sort_by = searchParams.get("sort_by");
            query += ` ORDER BY block_num ${DEFAULT_SORT_BY} `

        }
        const limit = parseLimit(q.limit);
        query += ` LIMIT ${limit} `
        let offset;
        if (q.page) offset = q.page * limit;
        if (offset) query += ` OFFSET ${offset} `

        console.log(query)
        return query;
    }
    else {
        return ""
    }
}



export function getContracts(endpoint: UsageEndpoints, query_param: any, example?: boolean) {
    if (endpoint === "/{chain}/tokens") {
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
        const table = `${q.chain}_erc20_token.contracts`
        let query = `SELECT  
    ${table}.contract,
    ${table}.name,
    ${table}.symbol,
    ${table}.decimals as precision,
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
        let offset;
        if (q.page) offset = q.page * limit;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }
}




function getBalanceChanges_latest(q: any) {

    let contract;
    let owner;

    if (q.contract) contract = getAddress(q.contract, "contract", false)?.toLowerCase();
    if (q.account) owner = getAddress(q.account, "account", false)?.toLowerCase();

    let table = `${q.chain}_erc20_token.account_balances`
    const contractTable = `${q.chain}_erc20_token.contracts`;
    let query = `SELECT
    ${table}.account,
    ${table}.contract,
    ${table}.amount,
    toDateTime(toUnixTimestamp(${table}.timestamp)*1000) AS timestamp,
    ${table}.block_num `
    query += ` FROM ${table} FINAL`

    // WHERE statements
    const where = [];

    // equals
    where.push(`account == '${owner}'`)
    where.push(`amount != '0'`);
    if (contract) where.push(`contract == '${contract}'`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;

    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`


    //ADD limit
    const limit = parseLimit(q.limit);
    query += ` LIMIT ${limit} `
    let offset;
    if (q.page) offset = q.page * limit;
    if (offset) query += ` OFFSET ${offset} `


    // add Join contract

    let Allquery = `SELECT 
    query.account,
    query.contract,
    query.amount,
    ${contractTable}.name as name,
    ${contractTable}.symbol as symbol,
    ${contractTable}.decimals as precision,
    query.timestamp,
    query.block_num,

    FROM (${query}) as query JOIN ${contractTable} ON query.contract = ${contractTable}.contract`

    return Allquery;
}

function getBalanceChanges_historical(q: any) {
    let contract;
    let owner;

    if (q.contract) contract = getAddress(q.contract, "contract", false)?.toLowerCase();
    if (q.account) owner = getAddress(q.account, "account", false)?.toLowerCase();

    let table;
    const contractTable = `${q.chain}_erc20_token.contracts`;
    // SQL Query
    if (contract) table = `${q.chain}_erc20_token.balance_changes_contract_historical_mv`;
    else table = `${q.chain}_erc20_token.balance_changes_account_historical_mv`

    let query = `SELECT
    ${table}.owner,
    ${table}.contract,
    ${table}.new_balance AS amount,
    toDateTime(toUnixTimestamp(${table}.timestamp)*1000) AS timestamp,
    ${table}.block_num `
    query += ` FROM ${table}`

    //Join for latest block between block range selected
    const blockfilter: any = [];
    let blockfilterQuery = "";
    addBlockFilter(q, blockfilter);
    if (blockfilter.length) blockfilterQuery += ` WHERE(${blockfilter.join(' AND ')})`;
    let joinSelectQuery = "";

    if (contract) joinSelectQuery = `SELECT owner, MAX(block_num) as block_num   FROM (SELECT owner, block_num , contract FROM ${table} ${blockfilterQuery})`;
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

    // WHERE statements
    const where = [];

    // equals
    where.push(`owner == '${owner}'`)
    where.push(`amount != '0'`);
    if (contract) where.push(`contract == '${contract}'`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;


    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`

    //ADD limit
    const limit = parseLimit(q.limit);
    query += ` LIMIT ${limit} `
    let offset;
    if (q.page) offset = q.page * limit;
    if (offset) query += ` OFFSET ${offset} `


    // add Join contract

    let Allquery = `SELECT 
    query.owner as account,
    query.contract,
    query.amount,
    ${contractTable}.name as name,
    ${contractTable}.symbol as symbol,
    ${contractTable}.decimals as precision,
    query.timestamp,
    query.block_num,

    FROM (${query}) as query JOIN ${contractTable} ON query.contract = ${contractTable}.contract`

    return Allquery;
}
export function getBalanceChanges(endpoint: UsageEndpoints, query_param: any) {

    if (endpoint === "/{chain}/balance") {
        const q = query_param as ValidUserParams<typeof endpoint>;
        let query;
        if (q.block_num) query = getBalanceChanges_historical(q);
        else query = getBalanceChanges_latest(q);
        return query;
    }
    else {
        return ""
    }


}







function getHolder_latest(q: any) {
    const contract = getAddress(q.contract, "contract", false)?.toLowerCase();
    // SQL Query
    const table = `${q.chain}_erc20_token.token_holders_mv`
    let query = `SELECT 
    account,
    amount,
    block_num ,
    toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp
    FROM ${table} FINAL`;

    // WHERE statements
    const where: any = [];
    if (contract) where.push(`contract == '${contract}'`);
    where.push(`amount != '0'`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;

    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`

    const limit = parseLimit(q.limit, 100);
    if (limit) query += ` LIMIT ${limit} `;
    let offset;
    if (q.page) offset = q.page * limit;
    if (offset) query += ` OFFSET ${offset} `

    return query;
}

function getHolder_historical(q: any) {

    const contract = getAddress(q.contract, "contract", false)?.toLowerCase();
    // SQL Query
    const table = `${q.chain}_erc20_token.balance_changes_contract_historical_mv`
    let query = `SELECT 
    owner as account,
    new_balance AS amount,
    block_num ,
    toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp
FROM ${table} `;

    //Join for latest block between block range selected
    const blockfilter: any = [];
    let blockfilterQuery = "";
    addBlockFilter(q, blockfilter);
    if (blockfilter.length) blockfilterQuery += ` WHERE(${blockfilter.join(' AND ')})`;

    let joinSelectQuery = `SELECT account, MAX(block_num) as block_num  FROM (SELECT owner as account, block_num ,contract FROM ${table} ${blockfilterQuery})`;
    const joinWhereQuery: any = [];

    //add where filter to joinQuery
    joinWhereQuery.push(`contract == '${contract}'`);
    if (joinWhereQuery.length) joinSelectQuery += ` WHERE(${joinWhereQuery.join(' AND ')})`;

    //Add group by to joinQuery
    joinSelectQuery += ` GROUP BY account`

    query += `JOIN (${joinSelectQuery}) as latest ON ${table}.owner = latest.account AND ${table}.block_num = latest.block_num`

    // WHERE statements
    const where: any = [];
    if (contract) where.push(`contract == '${contract}'`);
    where.push(`amount != '0'`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;

    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`

    const limit = parseLimit(q.limit, 100);
    if (limit) query += ` LIMIT ${limit} `;
    let offset;
    if (q.page) offset = q.page * limit;
    if (offset) query += ` OFFSET ${offset} `

    return query;
}

export function getHolders(endpoint: UsageEndpoints, query_param: any) {


    if (endpoint === "/{chain}/holders") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let query;
        if (q.block_num) query = getHolder_historical(q);
        else query = getHolder_latest(q);
        return query;
    }
    else {
        return ""
    }
}

export function getTransfers(endpoint: UsageEndpoints, query_param: any) {


    if (endpoint === "/{chain}/transfers") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract;
        let from;
        let to;

        if (q.contract) contract = getAddress(q.contract, "contract", false)?.toLowerCase();
        if (q.from) from = getAddress(q.from, "from", false)?.toLowerCase();
        if (q.to) to = getAddress(q.to, "to", false)?.toLowerCase();


        // SQL Query
        let table = `${q.chain}_erc20_token.transfers`
        let mvFromTable = `${q.chain}_erc20_token.transfers_from_historical_mv`
        let mvToTable = `${q.chain}_erc20_token.transfers_to_historical_mv`
        let mvContractTable = `${q.chain}_erc20_token.transfers_contract_historical_mv`

        let query = `SELECT
        contract,
        from,
        to,
        value as amount,
        tx_id,
        action_index,
        block_num,
        toDateTime(toUnixTimestamp(timestamp)*1000) as timestamp`

        if (contract) query += ` FROM ${mvContractTable}`
        else if (!contract && from && !to) query += ` FROM ${mvFromTable}`
        else if (!contract && !from && to) query += ` FROM ${mvToTable}`
        else if (!contract && from && to) query += ` FROM ${mvFromTable}`
        else query += ` FROM ${table}`


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


        //ADD limit
        const limit = parseLimit(q.limit, 100);
        query += ` LIMIT ${limit} `
        let offset;
        if (q.page) offset = q.page * limit;
        if (offset) query += ` OFFSET ${offset} `
        return query;
    }
    else {
        return ""
    }
}


export function getTransfer(endpoint: UsageEndpoints, query_param: any) {
    if (endpoint === "/{chain}/transfers/{trx_id}") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract;
        let from;
        let to;

        //  const chain = searchParams.get("chain");
        const transaction_id = formatTxid(q.trx_id);


        // SQL Query
        let table = `${q.chain}_erc20_token.transfers`

        let query = `SELECT
        contract,
        from,
        to,
        value as amount,
        tx_id,
        action_index,
        block_num,
        toDateTime(toUnixTimestamp(timestamp)*1000) as timestamp`

        query += ` FROM ${table}`


        // WHERE statements
        const where = [];

        // equals
        if (transaction_id) where.push(`id LIKE '${transaction_id}%'`);

        // Join WHERE statements with AND
        if (where.length) query += ` WHERE(${where.join(' AND ')})`;

        return query;
    }
    else {
        return ""
    }
}
