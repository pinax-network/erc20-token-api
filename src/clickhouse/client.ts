import { createClient } from "@clickhouse/client-web";
import { ping } from "./ping.js";
import { APP_NAME, config } from "../config.js";

// TODO: Check how to abort previous queries if haven't returned yet
// TODO: Make client connect to all DB instances
const client = createClient({
    username: config.username,
    password: config.password,
    url: config.host,
    clickhouse_settings: {
        allow_experimental_object_type: 1,
        readonly: "1",
        exact_rows_before_limit: 1
    },
    application: APP_NAME,
});

// These overrides should not be required but the @clickhouse/client-web instance
// does not work well with Bun's implementation of Node streams.
// https://github.com/oven-sh/bun/issues/5470
client.command = client.exec;
client.ping = ping;

export default client;