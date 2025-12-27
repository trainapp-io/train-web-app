import './datadog';
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import './styles/global.css'
import App from './App.tsx'

console.log("Instrumentation file executing...");
const environment = import.meta.env.MODE || "production";

console.log("Environment:", environment);
console.log("All env vars:", import.meta.env);

// Start MSW in development mode
// async function enableMocking() {
//   if (import.meta.env.MODE === 'development') {
//     const { worker } = await import('./mocks/browser');
//     return worker.start({
//       onUnhandledRequest: 'bypass',
//     });
//   }
// }

const root = document.getElementById("root");

// enableMocking().then(() => {
  ReactDOM.createRoot(root!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
// });
