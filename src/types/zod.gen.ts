import z from "zod";

export type APIError = z.infer<typeof APIError>;
export const APIError = z.object({
  status: z.union([
    z.literal(500),
    z.literal(504),
    z.literal(400),
    z.literal(401),
    z.literal(403),
    z.literal(404),
    z.literal(405),
  ]),
  code: z.union([
    z.literal("bad_database_response"),
    z.literal("bad_header"),
    z.literal("missing_required_header"),
    z.literal("bad_query_input"),
    z.literal("database_timeout"),
    z.literal("forbidden"),
    z.literal("internal_server_error"),
    z.literal("method_not_allowed"),
    z.literal("route_not_found"),
    z.literal("unauthorized"),
  ]),
  message: z.string(),
});

export type BalanceChange = z.infer<typeof BalanceChange>;
export const BalanceChange = z.object({
  contract: z.string(),
  owner: z.string(),
  amount: z.string(),
  old_balance: z.string(),
  new_balance: z.string(),
  change_type: z.number(),
  block_num: z.number(),
  timestamp: z.number(),
  transaction_id: z.string(),
});

export type Contract = z.infer<typeof Contract>;
export const Contract = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  block_num: z.number(),
  timestamp: z.number(),
});

export type Holder = z.infer<typeof Holder>;
export const Holder = z.object({
  account: z.string(),
  balance: z.string(),
});

export type Pagination = z.infer<typeof Pagination>;
export const Pagination = z.object({
  next_page: z.number(),
  previous_page: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
});

export type QueryStatistics = z.infer<typeof QueryStatistics>;
export const QueryStatistics = z.object({
  elapsed: z.number(),
  rows_read: z.number(),
  bytes_read: z.number(),
});

export type ResponseMetadata = z.infer<typeof ResponseMetadata>;
export const ResponseMetadata = z.object({
  statistics: z.union([QueryStatistics, z.null()]),
  next_page: z.number(),
  previous_page: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
});

export type Supply = z.infer<typeof Supply>;
export const Supply = z.object({
  address: z.string(),
  supply: z.string(),
  block_num: z.number(),
  timestamp: z.number(),
});

export type Transfer = z.infer<typeof Transfer>;
export const Transfer = z.object({
  address: z.string(),
  from: z.string(),
  to: z.string(),
  value: z.string(),
  block_num: z.number(),
  timestamp: z.number(),
  transaction_id: z.string(),
});

export type TypeSpec_OpenAPI_Contact = z.infer<typeof TypeSpec_OpenAPI_Contact>;
export const TypeSpec_OpenAPI_Contact = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  email: z.string().optional(),
});

export type Version = z.infer<typeof Version>;
export const Version = z.object({
  version: z.string(),
  commit: z.string(),
});

export type get_Usage_balance = typeof get_Usage_balance;
export const get_Usage_balance = {
  method: z.literal("GET"),
  path: z.literal("/balance"),
  parameters: z.object({
    query: z.object({
      block_num: z.union([z.number(), z.undefined()]),
      contract: z.union([z.string(), z.undefined()]),
      account: z.string(),
      greater_or_equals_by_block: z.union([z.number(), z.undefined()]),
      less_or_equals_by_block: z.union([z.number(), z.undefined()]),
      greater_by_block: z.union([z.number(), z.undefined()]),
      less_by_block: z.union([z.number(), z.undefined()]),
      greater_or_equals_by_timestamp: z.union([z.number(), z.undefined()]),
      less_or_equals_by_timestamp: z.union([z.number(), z.undefined()]),
      greater_by_timestamp: z.union([z.number(), z.undefined()]),
      less_by_timestamp: z.union([z.number(), z.undefined()]),
      limit: z.union([z.number(), z.undefined()]),
      page: z.union([z.number(), z.undefined()]),
    }),
  }),
  response: z.object({
    data: z.array(BalanceChange),
    meta: ResponseMetadata,
  }),
};

export type get_Usage_contract = typeof get_Usage_contract;
export const get_Usage_contract = {
  method: z.literal("GET"),
  path: z.literal("/contract"),
  parameters: z.object({
    query: z.object({
      contract: z.string().optional(),
      symbol: z.string().optional(),
      name: z.string().optional(),
      greater_or_equals_by_block: z.number().optional(),
      less_or_equals_by_block: z.number().optional(),
      greater_by_block: z.number().optional(),
      less_by_block: z.number().optional(),
      greater_or_equals_by_timestamp: z.number().optional(),
      less_or_equals_by_timestamp: z.number().optional(),
      greater_by_timestamp: z.number().optional(),
      less_by_timestamp: z.number().optional(),
      limit: z.number().optional(),
      page: z.number().optional(),
    }),
  }),
  response: z.object({
    data: TypeSpec_OpenAPI_Contact,
    meta: ResponseMetadata,
  }),
};

export type get_Usage_head = typeof get_Usage_head;
export const get_Usage_head = {
  method: z.literal("GET"),
  path: z.literal("/head"),
  parameters: z.object({
    query: z.object({
      limit: z.number().optional(),
      page: z.number().optional(),
    }),
  }),
  response: z.object({
    data: z.array(
      z.object({
        block_num: z.number(),
      }),
    ),
    meta: ResponseMetadata,
  }),
};

export type get_Monitoring_health = typeof get_Monitoring_health;
export const get_Monitoring_health = {
  method: z.literal("GET"),
  path: z.literal("/health"),
  parameters: z.never(),
  response: z.string(),
};

export type get_Usage_holders = typeof get_Usage_holders;
export const get_Usage_holders = {
  method: z.literal("GET"),
  path: z.literal("/holders"),
  parameters: z.object({
    query: z.object({
      contract: z.string(),
      greater_or_equals_by_block: z.union([z.number(), z.undefined()]),
      less_or_equals_by_block: z.union([z.number(), z.undefined()]),
      greater_by_block: z.union([z.number(), z.undefined()]),
      less_by_block: z.union([z.number(), z.undefined()]),
      greater_or_equals_by_timestamp: z.union([z.number(), z.undefined()]),
      less_or_equals_by_timestamp: z.union([z.number(), z.undefined()]),
      greater_by_timestamp: z.union([z.number(), z.undefined()]),
      less_by_timestamp: z.union([z.number(), z.undefined()]),
      limit: z.union([z.number(), z.undefined()]),
      page: z.union([z.number(), z.undefined()]),
    }),
  }),
  response: z.object({
    data: z.array(Holder),
    meta: ResponseMetadata,
  }),
};

export type get_Monitoring_metrics = typeof get_Monitoring_metrics;
export const get_Monitoring_metrics = {
  method: z.literal("GET"),
  path: z.literal("/metrics"),
  parameters: z.never(),
  response: z.string(),
};

export type get_Docs_openapi = typeof get_Docs_openapi;
export const get_Docs_openapi = {
  method: z.literal("GET"),
  path: z.literal("/openapi"),
  parameters: z.never(),
  response: z.unknown(),
};

export type get_Usage_supply = typeof get_Usage_supply;
export const get_Usage_supply = {
  method: z.literal("GET"),
  path: z.literal("/supply"),
  parameters: z.object({
    query: z.object({
      contract: z.string().optional(),
      symbol: z.string().optional(),
      name: z.string().optional(),
      greater_or_equals_by_block: z.number().optional(),
      less_or_equals_by_block: z.number().optional(),
      greater_by_block: z.number().optional(),
      less_by_block: z.number().optional(),
      greater_or_equals_by_timestamp: z.number().optional(),
      less_or_equals_by_timestamp: z.number().optional(),
      greater_by_timestamp: z.number().optional(),
      less_by_timestamp: z.number().optional(),
      limit: z.number().optional(),
      page: z.number().optional(),
    }),
  }),
  response: z.object({
    data: z.array(Supply),
    meta: ResponseMetadata,
  }),
};

export type get_Usage_transfers = typeof get_Usage_transfers;
export const get_Usage_transfers = {
  method: z.literal("GET"),
  path: z.literal("/transfers"),
  parameters: z.object({
    query: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      address: z.string().optional(),
      amount_greater_or_equals: z.string().optional(),
      amount_less_or_equals: z.string().optional(),
      amount_greater: z.string().optional(),
      amount_less: z.string().optional(),
      greater_or_equals_by_block: z.number().optional(),
      less_or_equals_by_block: z.number().optional(),
      greater_by_block: z.number().optional(),
      less_by_block: z.number().optional(),
      greater_or_equals_by_timestamp: z.number().optional(),
      less_or_equals_by_timestamp: z.number().optional(),
      greater_by_timestamp: z.number().optional(),
      less_by_timestamp: z.number().optional(),
      limit: z.number().optional(),
      page: z.number().optional(),
    }),
  }),
  response: z.object({
    data: z.array(Transfer),
    meta: ResponseMetadata,
  }),
};

export type get_Usage_transfer = typeof get_Usage_transfer;
export const get_Usage_transfer = {
  method: z.literal("GET"),
  path: z.literal("/transfers/{transaction_id}"),
  parameters: z.object({
    query: z.object({
      limit: z.number().optional(),
      page: z.number().optional(),
    }),
    path: z.object({
      transaction_id: z.string(),
    }),
  }),
  response: z.object({
    data: z.array(Transfer),
    meta: ResponseMetadata,
  }),
};

export type get_Docs_version = typeof get_Docs_version;
export const get_Docs_version = {
  method: z.literal("GET"),
  path: z.literal("/version"),
  parameters: z.never(),
  response: Version,
};

// <EndpointByMethod>
export const EndpointByMethod = {
  get: {
    "/balance": get_Usage_balance,
    "/contract": get_Usage_contract,
    "/head": get_Usage_head,
    "/health": get_Monitoring_health,
    "/holders": get_Usage_holders,
    "/metrics": get_Monitoring_metrics,
    "/openapi": get_Docs_openapi,
    "/supply": get_Usage_supply,
    "/transfers": get_Usage_transfers,
    "/transfers/{transaction_id}": get_Usage_transfer,
    "/version": get_Docs_version,
  },
};
export type EndpointByMethod = typeof EndpointByMethod;
// </EndpointByMethod>

// <EndpointByMethod.Shorthands>
export type GetEndpoints = EndpointByMethod["get"];
export type AllEndpoints = EndpointByMethod[keyof EndpointByMethod];
// </EndpointByMethod.Shorthands>

// <ApiClientTypes>
export type EndpointParameters = {
  body?: unknown;
  query?: Record<string, unknown>;
  header?: Record<string, unknown>;
  path?: Record<string, unknown>;
};

export type MutationMethod = "post" | "put" | "patch" | "delete";
export type Method = "get" | "head" | MutationMethod;

export type DefaultEndpoint = {
  parameters?: EndpointParameters | undefined;
  response: unknown;
};

export type Endpoint<TConfig extends DefaultEndpoint = DefaultEndpoint> = {
  operationId: string;
  method: Method;
  path: string;
  parameters?: TConfig["parameters"];
  meta: {
    alias: string;
    hasParameters: boolean;
    areParametersRequired: boolean;
  };
  response: TConfig["response"];
};

type Fetcher = (
  method: Method,
  url: string,
  parameters?: EndpointParameters | undefined,
) => Promise<Endpoint["response"]>;

type RequiredKeys<T> = {
  [P in keyof T]-?: undefined extends T[P] ? never : P;
}[keyof T];

type MaybeOptionalArg<T> = RequiredKeys<T> extends never ? [config?: T] : [config: T];

// </ApiClientTypes>

// <ApiClient>
export class ApiClient {
  baseUrl: string = "";

  constructor(public fetcher: Fetcher) {}

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    return this;
  }

  // <ApiClient.get>
  get<Path extends keyof GetEndpoints, TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("get", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.get>
}

export function createApiClient(fetcher: Fetcher, baseUrl?: string) {
  return new ApiClient(fetcher).setBaseUrl(baseUrl ?? "");
}

/**
 Example usage:
 const api = createApiClient((method, url, params) =>
   fetch(url, { method, body: JSON.stringify(params) }).then((res) => res.json()),
 );
 api.get("/users").then((users) => console.log(users));
 api.post("/users", { body: { name: "John" } }).then((user) => console.log(user));
 api.put("/users/:id", { path: { id: 1 }, body: { name: "John" } }).then((user) => console.log(user));
*/

// </ApiClient
