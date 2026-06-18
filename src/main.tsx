import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const analyticsScript = import.meta.env.VITE_UMAMI_SCRIPT_URL;
const analyticsWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (analyticsScript && analyticsWebsiteId) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = analyticsScript;
  script.dataset.websiteId = analyticsWebsiteId;
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
