import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppDirectory } from "./components/AppDirectory";
import { hydrateBrandFromCache } from "./brand";
import { hasConnInUrl, isEmbedMode, loadConfig } from "./config";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró #root");

void loadConfig().then(() => {
  if (isEmbedMode()) document.documentElement.classList.add("embed");
  if (hasConnInUrl()) {
    hydrateBrandFromCache();
    createRoot(root).render(<App />);
  } else {
    createRoot(root).render(<AppDirectory />);
  }
});
