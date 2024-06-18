# ERC20 Token API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/erc20-token-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/erc20-token-api/actions/workflows/bun-test.yml)

> Tokens information from the erc20 blockchains, powered by [Substreams](https://substreams.streamingfast.io/)

## REST API

### Usage

|           Method           | Path                  | Description                                              |
| :------------------------: | --------------------- | -------------------------------------------------------- |
|    GET <br>`text/html`     | `/`                   | [Swagger](https://swagger.io/) API playground            |
| GET <br>`application/json` | `/balance`            | Balances of an account.                                  |
| GET <br>`application/json` | `/head`               | Information about the current head block in the database |
| GET <br>`application/json` | `/holders`            | List of holders of a token                               |
| GET <br>`application/json` | `/supply`             | Total supply for a token                                 |
| GET <br>`application/json` | `/transfers`          | All transfers related to a token                         |
| GET <br>`application/json` | `/transfers/{trx_id}` | Specific transfer related to a token                     |
| GET <br>`application/json` | `/contract/`          | Get Token contract information                           |

### Docs

|           Method           | Path       | Description                                        |
| :------------------------: | ---------- | -------------------------------------------------- |
| GET <br>`application/json` | `/openapi` | [OpenAPI](https://www.openapis.org/) specification |
| GET <br>`application/json` | `/version` | API version and Git short commit hash              |

### Monitoring

|        Method        | Path       | Description                                  |
| :------------------: | ---------- | -------------------------------------------- |
| GET <br>`text/plain` | `/health`  | Checks database connection                   |
| GET <br>`text/plain` | `/metrics` | [Prometheus](https://prometheus.io/) metrics |

## Requirements

-   [ClickHouse](clickhouse.com/)
-   (Optional) A [Substream sink](https://substreams.streamingfast.io/reference-and-specs/glossary#sink) for loading data into ClickHouse. We recommend [Substreams Sink ClickHouse](https://github.com/pinax-network/substreams-sink-clickhouse/) or [Substreams Sink SQL](https://github.com/streamingfast/substreams-sink-sql). You should use the generated [`protobuf` files](tsp-output/@typespec/protobuf) to build your substream.

## Quick start

Install [Bun](https://bun.sh/)

```console
$ bun install
$ bun dev
```

**Tests**

```console
$ bun lint
$ bun test
```

## [`Bun` Binary Releases](https://github.com/pinax-network/erc20-token-api/releases)

> [!WARNING]
> Linux x86 only

```console
$ wget https://github.com/pinax-network/erc20-token-api/releases/download/v0.0.1/erc20-token-api
$ chmod +x ./erc20-token-api
$ ./erc20-token-api --help
Usage: erc20-token-api [options]

Token balances, supply and transfers from the erc20 blockchains

Options:
  -V, --version            output the version number
  -p, --port <number>      HTTP port on which to attach the API (default: "8080", env: PORT)
  --hostname <string>      Server listen on HTTP hostname (default: "localhost", env: HOSTNAME)
  --host <string>          Database HTTP hostname (default: "http://localhost:8123", env: HOST)
  --database <string>      The database to use inside ClickHouse (default: "default", env: DATABASE)
  --username <string>      Database user (default: "default", env: USERNAME)
  --password <string>      Password associated with the specified username (default: "", env: PASSWORD)
  --max-limit <number>     Maximum LIMIT queries (default: 10000, env: MAX_LIMIT)
  -v, --verbose <boolean>  Enable verbose logging (choices: "true", "false", default: false, env: VERBOSE)
  -h, --help               display help for command
```

## `.env` Environment variables

```env
# API Server
PORT=8080
HOSTNAME=localhost

# Clickhouse Database
HOST=http://127.0.0.1:8123
DATABASE=default
USERNAME=default
PASSWORD=
TABLE=
MAX_LIMIT=500

# Logging
VERBOSE=true
```

## Docker environment

-   Pull from GitHub Container registry

**For latest release**

```bash
docker pull ghcr.io/pinax-network/erc20-token-api:latest
```

**For head of `develop` branch**

```bash
docker pull ghcr.io/pinax-network/erc20-token-api:develop
```

-   Build from source

```bash
docker build -t erc20-token-api .
```

-   Run with `.env` file

```bash
docker run -it --rm --env-file .env ghcr.io/pinax-network/erc20-token-api
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).
