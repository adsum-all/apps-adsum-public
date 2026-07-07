import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import "./styles.css";
import "./pointage.css";
import "./engagement.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("root element not found");
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
