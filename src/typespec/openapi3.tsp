import "@typespec/http";
import "@typespec/openapi";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service({ title: "ERC20 Token API" })
@info({
    summary: "Tokens information from the Antelope blockchains, powered by Substreams",
    license: {
        name: "MIT",
        url: "https://github.com/pinax-network/antelope-token-api/blob/4f4bf36341b794c0ccf5b7a14fdf810be06462d2/LICENSE"
    },
    version: "3.0.0"
}) // From @typespec/openapi
namespace ERC20TokenAPI;

// Error codes adapted from https://github.com/pinax-network/golang-base/blob/develop/response/errors.go
alias APIErrorCode =
    | "bad_database_response" // invalid response from the database
    | "bad_header" // invalid or malformed header given
    | "missing_required_header" // request is missing a header
    | "bad_query_input" // given query input is missing or malformed
    | "database_timeout" // timeout while connecting to database
    | "forbidden" // not allowed to access this endpoint
    | "internal_server_error" // an unknown error occurred on the backend
    | "method_not_allowed" // http method is not allowed on this endpoint
    | "route_not_found" // the requested route was not found
    | "unauthorized"; // invalid authorization information given

alias ErrorStatusCode = 500 | 504 | 400 | 401 | 403 | 404 | 405;


@error
model APIError {
    status: ErrorStatusCode;
    code: APIErrorCode;
    message: string;
}

// Models will be present in the OpenAPI components
model Transfer is Models.Transfer<unixTimestamp32>;
model BalanceChange is Models.BalanceChange<unixTimestamp32>;
model Supply is Models.Supply<unixTimestamp32>;
model Holder {
    account: BalanceChange.owner;
    balance: BalanceChange.amount;
}
model Contract is Models.Contract<unixTimestamp32>;

model QueryStatistics {
    elapsed: float;
    rows_read: safeint;
    bytes_read: safeint;
}

model Pagination {
    next_page: safeint;
    previous_page: safeint;
    total_pages: safeint;
    total_results: safeint;
}

model ResponseMetadata {
    statistics: QueryStatistics | null;
    ...Pagination;
}

model UsageResponse<T> {
    data: T;
    meta: ResponseMetadata;
}


//alias for filtering by  Block number
alias BlockFilter = {
    @query block_num?: BlockInfo.block_num,
};

//alias for filtering by  Blocks range number
alias BlockRangeFilter = {
    @query({
        format: "csv",
    })
    block_range?: BlockInfo.block_num[],
};


//alias for filtering by  amount
alias AmountFilter = {
    @query amount_greater_or_equals?: Transfer.value,
    @query amount_less_or_equals?: Transfer.value,
    @query amount_greater?: Transfer.value,
    @query amount_less?: Transfer.value,
};

// Alias will *not* be present in the OpenAPI components.
// This also helps preventing self-references in generated `components` for codegen to work properly.
alias APIResponse<T> = T | APIError;
alias PaginationQueryParams = {
    @query limit?: uint64 = 100;
    @query page?: uint64 = 1;
};

// Helper aliases for accessing underlying properties
alias BlockInfo = Models.BlockInfo<unixTimestamp32>;




enum SupportedChains {
    ETH: "eth",
    POLYGON: "polygon",
}

@tag("Usage")
interface Usage {
    /**
        Balances of an account.
        @returns Array of balances.
    */
    @summary("Token balance")
    @route("/{chain}/balance")
    @get
    balance(
        @path chain: SupportedChains,
        @query contract?: BalanceChange.contract,
        @query account: BalanceChange.owner,
        ...BlockFilter,
        ...PaginationQueryParams,
    ): APIResponse<UsageResponse<BalanceChange[]>>;

    /**
        List of holders of a token.
        @returns Array of accounts.
    */
    @summary("Token holders")
    @route("/{chain}/holders")
    @get
    holders(
        @path chain: SupportedChains,
        @query contract: BalanceChange.contract,
        ...BlockFilter,
        ...PaginationQueryParams,
    ): APIResponse<UsageResponse<Holder[]>>;

    /**
        Total supply for a token.
        @returns Array of supplies.
    */
    @summary("Token supply")
    @route("/{chain}/supply")
    @get
    supply(
        @path chain: SupportedChains,
        @query contract?: Supply.contract,
        @query symbol?: Contract.symbol,
        @query name?: Contract.name,
        ...BlockFilter,
        ...PaginationQueryParams,
    ): APIResponse<UsageResponse<Supply[]>>;

    /**
        get Token Contract information.
        @returns One contract.
    */
    @summary("Token contract information")
    @route("/{chain}/tokens")
    @get
    tokens(
        @path chain: SupportedChains,
        @query contract?: Supply.contract,
        @query symbol?: Contract.symbol,
        @query name?: Contract.name,
        ...PaginationQueryParams,
    ): APIResponse<UsageResponse<Contact>>;

    /**
        All transfers related to a token.
        @returns Array of transfers.
    */
    @summary("Token transfers")
    @route("/{chain}/transfers")
    @get
    transfers(
        @path chain: SupportedChains,
        @query from?: Transfer.from,
        @query to?: Transfer.to,
        @query contract?: Transfer.contract,
        ...BlockRangeFilter,
        ...PaginationQueryParams,
    ): APIResponse<UsageResponse<Transfer[]>>;

    /**
        Specific transfer related to a token.
        @returns Array of transfers.
    */
    @summary("Token transfer")
    @route("/{chain}/transfers/{trx_id}")
    @get
    transfer(
        @path chain: SupportedChains,
        @path trx_id: Models.CommonERC20.trx_id,
        ...PaginationQueryParams,
    ): APIResponse<UsageResponse<Transfer[]>>;


     /**
        Information about the current head block in the database.
        @returns Array of block information.
    */
        @summary("Chains and latest block available")
        @route("/chains")
        @get
        chains(...PaginationQueryParams): APIResponse<UsageResponse<{
            chain: SupportedChains,
            block_num: BlockInfo.block_num;
        }[]>>;
    
}

model Version {
    @pattern("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$") // Adapted from https://semver.org/
    version: string;

    @pattern("^[0-9a-f]{7}$")
    commit: string;
}

@tag("Docs")
interface Docs {
    /**
        Reflection endpoint to return OpenAPI JSON spec. Also used by Swagger to generate the frontpage.
        @returns The OpenAPI JSON spec
    */
    @summary("OpenAPI JSON spec")
    @route("/openapi")
    @get
    openapi(): APIResponse<Record<unknown>>;

    /**
        API version and Git short commit hash.
        @returns The API version and commit hash.
    */
    @summary("API version")
    @route("/version")
    @get
    version(): APIResponse<Version>;
}

@tag("Monitoring")
interface Monitoring {
    /**
        Checks database connection.
        @returns OK or APIError.
    */
    @summary("Health check")
    @route("/health")
    @get
    health(): APIResponse<string>;

    /**
        Prometheus metrics.
        @returns Metrics as text.
    */
    @summary("Prometheus metrics")
    @route("/metrics")
    @get
    metrics(): string;
}
