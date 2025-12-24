import './datadog';
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import './styles/global.css'
import App from './App.tsx'

// Start MSW in development and test environments
if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test') {
  import('./mocks/browser').then(({ worker }) => {
    worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('🔶 MSW worker started');
  });
}
import {
  createRoutesFromChildren,
  matchRoutes,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
import {
  createReactRouterV6Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
} from "@grafana/faro-react";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

console.log("Instrumentation file executing...");
const faroUrl = import.meta.env.VITE_FARO_URL;
const environment = import.meta.env.MODE || "production";

console.log("Environment:", environment);
console.log("Faro URL:", faroUrl || "Using default URL");
console.log("All env vars:", import.meta.env);

// Validate Faro URL
if (!faroUrl) {
  console.warn("⚠️ VITE_FARO_URL is not set! Using default fallback URL.");
}

try {
  const faro = initializeFaro({
    url: faroUrl,
    app: {
      name: "TrainApp",
      version: "1.0.0",
      environment: environment,
    },

    instrumentations: [
      // Mandatory, omits default instrumentations otherwise.
      ...getWebInstrumentations(),

      // Tracing package to get end-to-end visibility for HTTP requests.
      new TracingInstrumentation({
        instrumentationOptions: {
          // Requests to these URLs have tracing headers attached.
          propagateTraceHeaderCorsUrls: [new RegExp('https://api.trainapp.io/*')],
      }}),

      // React integration for React applications.
      new ReactIntegration({
        router: createReactRouterV6Options({
          createRoutesFromChildren,
          matchRoutes,
          Routes,
          useLocation,
          useNavigationType,
        }),
      }),
    ],
  });

  console.log("✅ Grafana Faro initialized successfully", faro);

  // Test if Faro can send data
  faro.api.pushLog(["Faro initialization test from " + environment]);
} catch (error) {
  console.error("❌ Failed to initialize Grafana Faro:", error);
}

const root = document.getElementById("root");


ReactDOM.createRoot(root!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
