import type { ReactNode } from "react";
import { tmHtml } from "./tm-html";

export { tmHtml };

/** Texto plano → nodos con ® en <sup class="rg-tm">. */
export function tmText(s: string): ReactNode {
  if (!s.includes("®")) return s;
  return s.split(/(®)/).map((part, i) =>
    part === "®" ? (
      <sup key={i} className="rg-tm">
        ®
      </sup>
    ) : (
      part
    ),
  );
}
