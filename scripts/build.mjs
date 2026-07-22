/**
 * Build _dist: CSS minificado + bundle ESM de js/main.tsx (React externo vía importmap).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "_dist");

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "js"), { recursive: true });
mkdirSync(join(dist, "css"), { recursive: true });

const cssIn = readFileSync(join(root, "css", "app.css"), "utf8");
const cssOut = minifyCss(cssIn);
writeFileSync(join(dist, "css", "app.css"), cssOut, "utf8");

const result = await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["js/main.tsx"],
  bundle: true,
  format: "esm",
  outfile: join(dist, "js", "main.js"),
  minify: true,
  sourcemap: true,
  target: "es2022",
  jsx: "automatic",
  legalComments: "none",
  external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
  metafile: true,
  logLevel: "info",
});

const jsOut = readFileSync(join(dist, "js", "main.js"));
const meta = {
  builtAt: new Date().toISOString(),
  mode: "bundle",
  entry: "js/main.tsx",
  files: 2,
  bytesIn: Buffer.byteLength(cssIn, "utf8") + (result.metafile
    ? Object.values(result.metafile.inputs).reduce((s, i) => s + i.bytes, 0)
    : 0),
  bytesOut: Buffer.byteLength(cssOut, "utf8") + jsOut.byteLength,
  hash: createHash("sha256").update(jsOut).update(cssOut).digest("hex").slice(0, 12),
  outputs: ["_dist/css/app.css", "_dist/js/main.js"],
};

writeFileSync(join(dist, "build-meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
const pct = meta.bytesIn ? Math.round((1 - meta.bytesOut / meta.bytesIn) * 100) : 0;
console.log(`OK _dist hash=${meta.hash} ${meta.bytesIn} → ${meta.bytesOut} B (−${pct}%)`);
