import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadConfig } from "./config";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró #root");

void loadConfig().then(() => {
  createRoot(root).render(<App />);
});
