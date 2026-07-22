#!/usr/bin/env node
/** One-shot Shoelace → Web Awesome renames in frontend sources (not _dist). */
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirs = ["js", "css", "tests"];
const extra = ["index.html", "global.d.ts"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === "_dist") continue;
      walk(p, out);
    } else if (/\.(tsx?|css|html|md)$/.test(name.name)) out.push(p);
  }
  return out;
}

const files = [
  ...extra.map((f) => join(root, f)).filter((p) => existsSync(p)),
  ...dirs.flatMap((d) => walk(join(root, d))),
];

const replacements = [
  // themes / classes
  [/sl-theme-dark/g, "wa-dark"],
  [/sl-theme-light/g, "wa-light"],
  // CSS vars (order matters)
  [/--sl-color-primary-600/g, "--wa-color-brand-fill-loud"],
  [/--sl-color-primary-500/g, "--wa-color-brand-fill-normal"],
  [/--sl-color-neutral-0/g, "--wa-color-surface-default"],
  [/--sl-font-sans/g, "--wa-font-family-body"],
  [/--sl-input-height-small/g, "--wa-form-control-height-s"],
  [/--sl-input-font-size-small/g, "--wa-form-control-font-size-s"],
  [/--sl-/g, "--wa-"],
  // JSX attrs before tag rename
  [/variant="primary"/g, 'variant="brand"'],
  [/size="small"/g, 'size="s"'],
  [/size="large"/g, 'size="l"'],
  [/clearable/g, "with-clear"],
  [/slot="prefix"/g, 'slot="start"'],
  [/slot="suffix"/g, 'slot="end"'],
  // events in strings
  [/"sl-input"/g, '"wa-input"'],
  [/"sl-change"/g, '"wa-change"'],
  [/"sl-clear"/g, '"wa-clear"'],
  [/"sl-after-hide"/g, '"wa-after-hide"'],
  [/"sl-request-close"/g, '"wa-request-close"'],
  [/addEventListener\("sl-/g, 'addEventListener("wa-'],
  [/removeEventListener\("sl-/g, 'removeEventListener("wa-'],
  // tags / selectors (avoid CarouselSlide etc.)
  [/<sl-/g, "<wa-"],
  [/<\/sl-/g, "</wa-"],
  [/& sl-/g, "& wa-"],
  [/\.hero sl-/g, ".hero wa-"],
  [/^sl-button/gm, "wa-button"],
  [/sl-button\[/g, "wa-button["],
  [/"sl-badge"/g, '"wa-badge"'],
  [/"sl-button"/g, '"wa-button"'],
  [/"sl-carousel"/g, '"wa-carousel"'],
  [/"sl-carousel-item"/g, '"wa-carousel-item"'],
  [/"sl-drawer"/g, '"wa-drawer"'],
  [/"sl-dialog"/g, '"wa-dialog"'],
  [/"sl-input"/g, '"wa-input"'],
  [/"sl-option"/g, '"wa-option"'],
  [/"sl-radio-button"/g, '"wa-radio-button"'],
  [/"sl-radio-group"/g, '"wa-radio-group"'],
  [/"sl-select"/g, '"wa-select"'],
  [/"sl-spinner"/g, '"wa-spinner"'],
  [/"sl-textarea"/g, '"wa-textarea"'],
  // comments / docs
  [/Shoelace/g, "Web Awesome"],
  [/shoelace/g, "webawesome"],
  [/useSl/g, "useWa"],
];

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  const before = src;
  for (const [re, to] of replacements) src = src.replace(re, to);
  if (src !== before) {
    writeFileSync(file, src);
    changed++;
    console.log("updated", file.replace(root + "\\", "").replace(root + "/", ""));
  }
}

const oldHook = join(root, "js/hooks/useSl.ts");
const newHook = join(root, "js/hooks/useWa.ts");
if (existsSync(oldHook)) {
  renameSync(oldHook, newHook);
  console.log("renamed useSl.ts → useWa.ts");
}

console.log("files changed:", changed);
