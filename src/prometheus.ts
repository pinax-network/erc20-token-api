// From https://github.com/pinax-network/substreams-sink-websockets/blob/main/src/prometheus.ts
import client, { Counter, CounterConfiguration, Gauge, GaugeConfiguration } from 'prom-client';
import { logger } from "./logger.js";

export const registry = new client.Registry();

// Metrics
export function registerCounter(name: string, help = "help", labelNames: string[] = [], config?: CounterConfiguration<string>) {
    try {
        registry.registerMetric(new Counter({ name, help, labelNames, ...config }));
        logger.debug(`Registered new counter metric: ${name}`);
        return registry.getSingleMetric(name) as Counter;
    } catch (e) {
        logger.error("Error registering counter:", { name, e });
        throw new Error(`${e}`);
    }
}

export function registerGauge(name: string, help = "help", labelNames: string[] = [], config?: GaugeConfiguration<string>) {
    try {
        registry.registerMetric(new Gauge({ name, help, labelNames, ...config }));
        logger.debug(`Registered new gauge metric: ${name}`);
        return registry.getSingleMetric(name) as Gauge;
    } catch (e) {
        logger.error("Error registering gauge:", { name, e });
        throw new Error(`${e}`);
    }
}

export async function getSingleMetric(name: string) {
    const metric = registry.getSingleMetric(name);
    const get = await metric?.get();
    return get?.values[0]?.value;
}

// REST API metrics
export const request_error = registerCounter('request_error', 'Total Requests errors', ['pathname', 'status']);
export const request = registerCounter('request', 'Total Requests', ['pathname']);
export const query = registerCounter('query', 'Clickhouse DB queries made');
export const bytes_read = registerCounter('bytes_read', 'Clickhouse DB Statistics bytes read');
export const rows_read = registerCounter('rows_read', 'Clickhouse DB Statistics rows read');
export const elapsed = registerCounter('elapsed', 'Clickhouse DB Statistics query elapsed time');
