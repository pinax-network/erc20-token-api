# ERC20 Token API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/erc20-token-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/erc20-token-api/actions/workflows/bun-test.yml)

> Tokens information from all EVM blockchains, powered by [Substreams](https://substreams.streamingfast.io/)
## REST API

### Usage

| Method | Path | Query parameters<br>(* = **Required**) | Description |
| :---: | --- | --- | --- |
| GET <br>`text/html` | `/` | - | [Swagger](https://swagger.io/) API playground |
| GET <br>`application/json` | `/chains` | `limit`<br>`page` | Information about the chains and latest head block in the database |
| GET <br>`application/json` | `/{chain}/balance` | `block_num`<br>`contract`<br>`account*`<br>`limit`<br>`page` | Balances of an account. |
| GET <br>`application/json` | `/{chain}/holders` | **`contract*`**<br>`limit`<br>`page` | List of holders of a token |
| GET <br>`application/json` | `/{chain}/supply` | `block_num`<br>`contract*`<br>`limit`<br>`page` | Total supply for a token |
| GET <br>`application/json` | `/{chain}/tokens` |`contract`<br>`symbol`<br>`name`<br>`limit`<br>`page` | Get info about available tokens |
| GET <br>`application/json` | `/{chain}/transfers` | `block_range`<br>`from`<br>`to`<br>`contract`<br>`limit`<br>`page` | All transfers related to a token |
| GET <br>`application/json` | `/{chain}/transfers/{trx_id}` | `limit`<br>`page` | Specific transfer related to a token |

### Docs

| Method | Path | Description |
| :---: | --- | --- |
| GET <br>`application/json` | `/openapi` | [OpenAPI](https://www.openapis.org/) specification |
| GET <br>`application/json` | `/version` | API version and Git short commit hash |

### Monitoring

| Method | Path | Description |
| :---: | --- | --- |
| GET <br>`text/plain` | `/health` | Checks database connection |
| GET <br>`text/plain` | `/metrics` | [Prometheus](https://prometheus.io/) metrics |

## Requirements

- [ClickHouse](clickhouse.com/), databases should follow a `{chain}_tokens_{version}` naming scheme. Database tables can be setup using the [`schema.sql`](./schema.sql) definitions created by the [`create_schema.sh`](./create_schema.sh) script.
- A [Substream sink](https://substreams.streamingfast.io/reference-and-specs/glossary#sink) for loading data into ClickHouse. We recommend [Substreams Sink ClickHouse](https://github.com/pinax-network/substreams-sink-clickhouse/) or [Substreams Sink SQL](https://github.com/pinax-network/substreams-sink-sql). You should use the generated [`protobuf` files](tsp-output/@typespec/protobuf) to build your substream. This Token API makes use of the [`erc20-substreams`](https://github.com/pinax-network/erc20-substreams) substream.

### API stack architecture

![Token API architecture diagram](token_api_architecture_diagram.png)

### Setting up the database backend (ClickHouse)

#### Without a cluster

Example on how to set up the ClickHouse backend for sinking [EOS](https://pinax.network/en/chain/eos) data.

1. Start the ClickHouse server

```console
clickhouse server
```

2. Create the token database

```console
echo "CREATE DATABASE eth_tokens_v1" | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>
```

3. Run the [`create_schema.sh`](./create_schema.sh) script

```console
./create_schema.sh -o /tmp/schema.sql
```

4. Execute the schema

```console
cat /tmp/schema.sql | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>
```

5. Run the [sink](https://github.com/pinax-network/substreams-sink-sql)

```console
substreams-sink-sql run clickhouse://<username>:<password>@<host>:9000/eth_tokens_v1 \
https://github.com/pinax-network/erc20-substreams/releases/download/v0.0.2/erc20-substreams-v0.0.2.spkg `#Substreams package` \
-e eth.substreams.pinax.network:443 `#Substreams endpoint` \
1: `#Block range <start>:<end>` \
--undo-buffer-size 1 --on-module-hash-mistmatch=warn --batch-block-flush-interval 100 --development-mode `#Additional flags`
```

6. Start the API

```console
# Will be available on locahost:8080 by default, Make sure --database exclude chains
erc20-token-api --host <host> --database tokens_v1 --username <username> --password <password> --verbose
```

#### With a cluster

If you run ClickHouse in a [cluster](https://clickhouse.com/docs/en/architecture/cluster-deployment), change step 2 & 3:

2. Create the token database

```console
echo "CREATE DATABASE eth_tokens_v1 ON CLUSTER <cluster>" | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>
```

3. Run the [`create_schema.sh`](./create_schema.sh) script

```console
./create_schema.sh -o /tmp/schema.sql -c <cluster>
```


## [`Bun` Binary Releases](https://github.com/pinax-network/antelope-token-api/releases)

> [!WARNING]
> Linux x86 only

```console
$ wget https://github.com/pinax-network/erc20-token-api/releases/download/v1.0.1/erc20-token-api
$ chmod +x ./erc20-token-api
$ ./erc20-token-api --help                                                                                                       
Usage: erc20-token-api [options]

Token balances, supply and transfers from the Antelope blockchains

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

- Pull from GitHub Container registry

**For latest tagged release**
```bash
docker pull ghcr.io/pinax-network/erc20-token-api:latest
```

**For head of `main` branch**
```bash
docker pull ghcr.io/pinax-network/erc20-token-api:develop
```

- Build from source
```bash
docker build -t erc20-token-api .
```

- Run with `.env` file
```bash
docker run -it --rm --env-file .env ghcr.io/pinax-network/erc20-token-api
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

### Quick start

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
