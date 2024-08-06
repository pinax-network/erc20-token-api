import { config, DEFAULT_SORT_BY } from "./config.js";
import type { UsageEndpoints, ValidUserParams } from "./types/api.js";
import { SupportedChainsSchema, supportedChainsSchema } from "./types/zod.gen.js"; { }


const DATABASE_SUFFIX = config.database;

export function addBlockFilter(q: any, additional_query_params: any, where: any[]) {


    if (q.block_num) {
        const max_block = q.block_num;
        where.push(`block_num <= {max_block : int}`);
        additional_query_params = { ...additional_query_params, max_block }

    }
    return additional_query_params;


}



export function addBlockRangeFilter(q: any, additional_query_params: any, where: any[]) {

    if (q.block_range && q.block_range != '0') {
        const parts = q.block_range.split(',');
        const min_block = parseInt(parts[0], 10);
        const max_block = parseInt(parts[1], 10);

        if (min_block && max_block) where.push(`block_num >= {min_block : int} AND block_num <= {max_block : int}`)
        else where.push(`block_num <= {max_block : int}`)

        additional_query_params = { ...additional_query_params, min_block, max_block }

    };

    return additional_query_params;
}


export function getChains() {


    //ADD more chains if needed
    let supportedChain: SupportedChainsSchema[] = supportedChainsSchema._def.values;
    let queries = [];

    // Use a for loop to iterate over each item
    for (const chain of supportedChain) {
        queries.push(`SELECT '${chain}' as chain, MIN(block_num) as block_num FROM ${chain}_${DATABASE_SUFFIX}.cursors`)
    }

    let query = queries.join(' UNION ALL ');
    return query;
}



export function getTotalSupply(endpoint: UsageEndpoints, query_param: any, example?: boolean) {

    if (endpoint === "/{chain}/supply") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract = q.contract

        let additional_query_params = {};


        // Query
        const table = `${q.chain}_${DATABASE_SUFFIX}.mv_supply_contract`
        const contractTable = `${q.chain}_${DATABASE_SUFFIX}.contracts`;
        let query = `SELECT
        ${table}.contract,
        ${table}.supply as supply,
        ${table}.block_num,
        ${contractTable}.name as name,
        ${contractTable}.symbol as symbol,
        ${contractTable}.decimals as precision,
        toUnixTimestamp(${table}.timestamp)*1000 as timestamp
    FROM ${table} FINAL `;



        // JOIN Contracts table
        query += ` LEFT JOIN ${contractTable} ON ${contractTable}.contract = ${table}.contract`;
        if (!example) {
            // WHERE statements
            const where = [];

            // equals
            if (contract) where.push(`${table}.contract = {contract : String}`);

            // timestamp and block filter
            
            if (q.block_num) {
                const max_block = q.block_num;
                where.push(`block_num >= {max_block : int}`);
                additional_query_params = { ...additional_query_params, max_block }
        
            }

            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            // const sort_by = searchParams.get("sort_by");
           if(q.block_num) query += ` ORDER BY block_num`
           else query += ` ORDER BY block_num DESC `

        }

        query += ` LIMIT 1 `


        return { query, additional_query_params };
    }
    else {
        let query = "";
        let additional_query_params = {};
        return { query, additional_query_params };
    }
}



export function getContracts(endpoint: UsageEndpoints, query_param: any, example?: boolean) {
    if (endpoint === "/{chain}/tokens") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract = q.contract;
        let symbol = q.symbol;
        let name = q.name;

        // Query
        const table = `${q.chain}_${DATABASE_SUFFIX}.contracts`
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
            if (contract) where.push(`contract = {contract : String}`);
            if (symbol) where.push(`LOWER(symbol) = {symbol : String} `);
            if (name) where.push(`LOWER(name) = {name : String} `);


            // Join WHERE statements with AND
            if (where.length) query += ` WHERE(${where.join(' AND ')})`;

            // Sort and Limit
            //const sort_by = searchParams.get("sort_by");
            query += ` ORDER BY block_num ${DEFAULT_SORT_BY} `

        }

        query += ` LIMIT {limit : int} `
        if (q.page) query += ` OFFSET {offset: int} `

 
        return query;
    }
    else {
        return ""
    }
}




function getBalanceChanges_latest(q: any) {

    let contract = q.contract;
    let account = q.account;

    let table = `${q.chain}_${DATABASE_SUFFIX}.account_balances`
    const contractTable = `${q.chain}_${DATABASE_SUFFIX}.contracts`;
    let query = `SELECT
    ${table}.account,
    ${table}.contract,
    ${table}.amount,
    toDateTime(toUnixTimestamp(${table}.timestamp)*1000) AS timestamp,
    ${table}.block_num `
    query += ` FROM ${table}`

    // WHERE statements
    const where = [];

    // equals
    where.push(`account = {account : String}`)
    where.push(`amount != '0'`);
    if (contract) where.push(`contract = {contract : String}`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;

    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`


    //ADD limit

    query += ` LIMIT {limit: int} `
    if (q.page) query += ` OFFSET {offset : int} `


    // add Join contract

    let Allquery = `SELECT DISTINCT
     query.account,
     query.contract,
     query.amount,
     ${contractTable}.name as name,
     ${contractTable}.symbol as symbol,
     ${contractTable}.decimals as precision,
     query.timestamp,
     query.block_num,
 
     FROM (${query}) as query  JOIN ${contractTable} ON query.contract = ${contractTable}.contract `


    return Allquery;
    return query;
}

function getBalanceChanges_historical(q: any) {
    let contract = q.contract;
    let account = q.account;
    let additional_query_params = {};

    let table;
    const contractTable = `${q.chain}_${DATABASE_SUFFIX}.contracts`;
    // SQL Query
    if (contract) table = `${q.chain}_${DATABASE_SUFFIX}.balance_changes_contract_historical_mv`;
    else table = `${q.chain}_${DATABASE_SUFFIX}.balance_changes_account_historical_mv`

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
    additional_query_params = addBlockFilter(q, additional_query_params, blockfilter);
    if (blockfilter.length) blockfilterQuery += ` WHERE(${blockfilter.join(' AND ')})`;
    let joinSelectQuery = "";

    if (contract) joinSelectQuery = `SELECT owner, MAX(block_num) as block_num   FROM (SELECT owner, block_num , contract FROM ${table} ${blockfilterQuery})`;
    else joinSelectQuery = `SELECT contract, owner, MAX(block_num) as block_num  FROM (SELECT owner, block_num , contract FROM ${table} ${blockfilterQuery})`;
    const joinWhereQuery: any = [];
    //add where filter to joinQuery
    if (contract) joinWhereQuery.push(`contract = {contract : String}`);
    joinWhereQuery.push(`owner = {account : String}`);
    if (joinWhereQuery.length) joinSelectQuery += ` WHERE(${joinWhereQuery.join(' AND ')})`;

    //Add group by to joinQuery
    if (contract) joinSelectQuery += ` GROUP BY owner`
    else joinSelectQuery += ` GROUP BY (owner,contract)`

    if (contract) query += ` JOIN (${joinSelectQuery}) as latest ON ${table}.owner = latest.owner AND ${table}.block_num = latest.block_num`
    else query += ` JOIN (${joinSelectQuery}) as latest ON ${table}.owner = latest.owner AND ${table}.block_num = latest.block_num AND ${table}.contract = latest.contract`

    // WHERE statements
    const where = [];

    // equals
    where.push(`owner = {account : String}`)
    where.push(`amount != '0'`);
    if (contract) where.push(`contract = {contract : String}`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;


    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`

    //ADD limit

    query += ` LIMIT {limit: int}`

    if (q.page) query += ` OFFSET {offset : int}`


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

    return { query: Allquery, additional_query_params };
}
export function getBalanceChanges(endpoint: UsageEndpoints, query_param: any) {

    if (endpoint === "/{chain}/balance") {
        const q = query_param as ValidUserParams<typeof endpoint>;
        let query;
        let additional_query_params = {};
        if (q.block_num) {
            ({ query, additional_query_params } = getBalanceChanges_historical(q));
        }
        else query = getBalanceChanges_latest(q);
        return { query, additional_query_params };
    }
    else {
        let query = "";
        let additional_query_params = {};
        return { query, additional_query_params };
    }


}


function getHolder_latest(q: any) {
    let contract = q.contract;
    // SQL Query
    const table = `${q.chain}_${DATABASE_SUFFIX}.token_holders_mv`
    let query = `SELECT 
    account,
    amount,
    block_num ,
    toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp
    FROM ${table} FINAL`;

    // WHERE statements
    const where: any = [];
    if (contract) where.push(`contract = {contract : String}`);
    where.push(`amount != '0'`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;

    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`

    query += ` LIMIT {limit: int} `;

    if (q.page) query += ` OFFSET {offset : int}`

    return query;
}

function getHolder_historical(q: any) {

    let contract = q.contract;
    let additional_query_params = {};
    // SQL Query
    const table = `${q.chain}_${DATABASE_SUFFIX}.balance_changes_contract_historical_mv`
    let query = `SELECT 
    owner as account,
    new_balance AS amount,
    block_num ,
    toDateTime(toUnixTimestamp(timestamp)*1000) AS timestamp
FROM ${table} `;

    //Join for latest block between block range selected
    const blockfilter: any = [];
    let blockfilterQuery = "";
    additional_query_params = addBlockFilter(q, additional_query_params, blockfilter);
    if (blockfilter.length) blockfilterQuery += ` WHERE(${blockfilter.join(' AND ')})`;

    let joinSelectQuery = `SELECT account, MAX(block_num) as block_num  FROM (SELECT owner as account, block_num ,contract FROM ${table} ${blockfilterQuery})`;
    const joinWhereQuery: any = [];

    //add where filter to joinQuery
    joinWhereQuery.push(`contract = {contract : String}`);
    if (joinWhereQuery.length) joinSelectQuery += ` WHERE(${joinWhereQuery.join(' AND ')})`;

    //Add group by to joinQuery
    joinSelectQuery += ` GROUP BY account`

    query += `JOIN (${joinSelectQuery}) as latest ON ${table}.owner = latest.account AND ${table}.block_num = latest.block_num`

    // WHERE statements
    const where: any = [];
    if (contract) where.push(`contract = {contract : String}`);
    where.push(`amount != '0'`);

    // Join WHERE statements with AND
    if (where.length) query += ` WHERE(${where.join(' AND ')})`;

    //add ORDER BY and GROUP BY
    query += ` ORDER BY amount DESC`


    query += ` LIMIT {limit: int} `;

    if (q.page) query += ` OFFSET {offset : int}`

    return { query, additional_query_params };
}

export function getHolders(endpoint: UsageEndpoints, query_param: any) {


    if (endpoint === "/{chain}/holders") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let query;
        let additional_query_params = {};
        if (q.block_num) {
            ({ query, additional_query_params } = getHolder_historical(q));
        }
        else query = getHolder_latest(q);
        return { query, additional_query_params };
    }
    else {
        let query = "";
        let additional_query_params = {};
        return { query, additional_query_params };
    }
}

export function getTransfers(endpoint: UsageEndpoints, query_param: any) {


    if (endpoint === "/{chain}/transfers") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        let contract = q.contract;
        let from = q.from;
        let to = q.to;
        let additional_query_params = {};

        // SQL Query
        let table = `${q.chain}_${DATABASE_SUFFIX}.transfers`
        let mvFromTable = `${q.chain}_${DATABASE_SUFFIX}.transfers_from_historical_mv`
        let mvToTable = `${q.chain}_${DATABASE_SUFFIX}.transfers_to_historical_mv`
        let mvContractTable = `${q.chain}_${DATABASE_SUFFIX}.transfers_contract_historical_mv`

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
        if (contract) where.push(`contract = {contract : String}`);
        if (from) where.push(`from = {from : String}`);
        if (to) where.push(`to = {to : String}`);

        // timestamp and block filter
        additional_query_params = addBlockRangeFilter(q, additional_query_params, where);

        // Join WHERE statements with AND
        if (where.length) query += ` WHERE(${where.join(' AND ')})`;
        //add ORDER BY and GROUP BY
        query += ` ORDER BY timestamp DESC`


        //ADD limit

        query += ` LIMIT {limit: int} `

        if (q.page) query += ` OFFSET {offset : int} `
        return query;
    }
    else {
        return ""
    }
}


export function getTransfer(endpoint: UsageEndpoints, query_param: any) {
    if (endpoint === "/{chain}/transfers/{trx_id}") {
        const q = query_param as ValidUserParams<typeof endpoint>;

        const transaction_id = q.trx_id;

        // SQL Query
        let table = `${q.chain}_${DATABASE_SUFFIX}.transfers`

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

        console.log(query);
        return query;
    }
    else {
        return ""
    }
}
