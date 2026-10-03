import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@ai-exhibit/scene-components/tokens.css";
import "./global.css";
// Applies the saved light/dark theme before the first paint.
import "./theme.ts";
// Side effects: every area registers its scene components by name.
import "@ai-exhibit/scene-components/registerAll";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
