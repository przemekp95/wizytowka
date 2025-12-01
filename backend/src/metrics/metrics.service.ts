import { Injectable } from '@nestjs/common';
import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly databaseOperationsTotal: Counter<string>;
  private readonly databaseOperationDuration: Histogram<string>;
  private readonly errorsTotal: Counter<string>;

  constructor() {
    // Zbieraj domyślne metryki systemowe
    collectDefaultMetrics({ prefix: 'wizytowka_' });

    // Metryka czasu trwania żądań HTTP
    this.httpRequestDuration = new Histogram({
      name: 'wizytowka_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Licznik całkowity żądań HTTP
    this.httpRequestsTotal = new Counter({
      name: 'wizytowka_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Aktywne połączenia
    this.activeConnections = new Gauge({
      name: 'wizytowka_active_connections',
      help: 'Number of active connections',
    });

    // Operacje bazodanowe
    this.databaseOperationsTotal = new Counter({
      name: 'wizytowka_database_operations_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'collection', 'success'],
    });

    this.databaseOperationDuration = new Histogram({
      name: 'wizytowka_database_operation_duration_seconds',
      help: 'Duration of database operations in seconds',
      labelNames: ['operation', 'collection'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    // Błędy
    this.errorsTotal = new Counter({
      name: 'wizytowka_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'route'],
    });
  }

  // Metody do rejestrowania metryk
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const durationSeconds = durationMs / 1000;
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(durationSeconds);
    this.httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
  }

  incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  decrementActiveConnections(): void {
    this.activeConnections.dec();
  }

  recordDatabaseOperation(
    operation: string,
    collection: string,
    durationMs: number,
    success: boolean,
  ): void {
    const durationSeconds = durationMs / 1000;
    this.databaseOperationDuration
      .labels(operation, collection)
      .observe(durationSeconds);
    this.databaseOperationsTotal
      .labels(operation, collection, success.toString())
      .inc();
  }

  recordError(type: string, route?: string): void {
    this.errorsTotal.labels(type, route || 'unknown').inc();
  }

  // Metoda do uzyskania metryk w formacie Prometheus
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Metoda do uzyskania rejestru metryk
  getRegister(): typeof register {
    return register;
  }
}
