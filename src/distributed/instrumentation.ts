import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// The service name should be set via OTEL_SERVICE_NAME environment variable
const serviceName = process.env.OTEL_SERVICE_NAME || 'github-wordmark-service';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
});

const sdk = new NodeSDK({
  serviceName,
  metricReader: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK immediately upon import to ensure instrumentation 
// is active before other modules are loaded.
sdk.start();
console.log(`[OTel] Telemetry initialized for ${serviceName}`);

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('SDK shut down successfully'))
    .catch((err) => console.error('Error shutting down SDK', err))
    .finally(() => process.exit(0));
});

export { sdk };
