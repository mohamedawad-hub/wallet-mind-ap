import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global Fetch Interceptor to align active accounts on the server with token metrics
const originalFetch = window.fetch;
const customFetch = async function (input: any, init: any) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isPremium = localStorage.getItem('premium') === 'true';
    const email = user?.email || 'guest';

    const actualInit = init || {};
    const headers = actualInit.headers 
      ? (actualInit.headers instanceof Headers 
         ? Object.fromEntries(actualInit.headers.entries()) 
         : { ...actualInit.headers })
      : {};

    headers['x-user-email'] = email;
    headers['x-user-premium'] = isPremium ? 'true' : 'false';
    actualInit.headers = headers;

    const response = await originalFetch(input, actualInit);

    if (response.status === 403) {
      const clone = response.clone();
      try {
        const text = await clone.text();
        const data = JSON.parse(text);
        if (data && data.quotaExceeded) {
          window.dispatchEvent(new CustomEvent('ai-quota-exceeded', { detail: data }));
        }
      } catch (e) {
        // ignore JSON parse failures
      }
    }
    return response;
  } catch (e) {
    return originalFetch(input, init);
  }
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true
  });
} catch (err) {
  console.warn("Unable to redefine window.fetch directly, attempting fallback on globalThis:", err);
  try {
    (globalThis as any).fetch = customFetch;
  } catch (gErr) {
    console.error("Failed to intercept global fetch:", gErr);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
