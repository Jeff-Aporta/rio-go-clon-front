import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { decodeConnParam, encodeConn, storageKey } from "../js/config.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const cssDir = join(root, "css");
const jsDir = join(root, "js");

function readCssAll(): string {
  return readdirSync(cssDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(cssDir, f), "utf8"))
    .join("\n");
}

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkTs(p, out);
    else if (/\.(ts|tsx)$/.test(name.name) && !name.name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

function readJsAll(): string {
  return walkTs(jsDir).map((p) => readFileSync(p, "utf8")).join("\n");
}

describe("CSS guardrails (docs/LLM.md)", () => {
  const css = readCssAll();

  it("no usa nesting estilo Sass (&-foo / &--bar)", () => {
    assert.equal(/&-{1,2}[a-zA-Z]/.test(css), false, "quitar selectores Sass; usar nesting nativo");
  });

  it("carousel --slide-gap lleva unidad (0px, no 0)", () => {
    assert.equal(/--slide-gap:\s*0\s*;/.test(css), false, "usar --slide-gap: 0px");
    assert.match(css, /--slide-gap:\s*0px/);
  });

  it("primary / checkout usan --rg-accent-fg", () => {
    assert.match(css, /--rg-accent-fg/);
    assert.match(css, /checkout-submit::part\(base\)\s*\{\s*color:\s*var\(--rg-accent-fg\)/);
    assert.match(css, /wa-button\[variant="brand"\]::part\(base\)[\s\S]*?--rg-accent-fg/);
  });

  it("cat-tiles centrados y sin look de card", () => {
    assert.match(css, /\.cat-tiles\s*\{[^}]*justify-content:\s*center/s);
    const tileBlock = css.match(/\.cat-tile\s*\{[\s\S]*?\n\}/);
    assert.ok(tileBlock, "falta .cat-tile");
    const block = tileBlock![0];
    assert.match(block, /border:\s*0/);
    assert.match(block, /background:\s*transparent/);
    assert.equal(/border:\s*1px\s+solid/.test(block), false, "cat-tile no debe ser card con borde");
    assert.equal(/background:\s*var\(--rg-surface\)/.test(block), false, "cat-tile no debe tener fondo surface");
    assert.match(block, /border-radius:\s*50%/);
  });

  it("video Tradición: frame 16:9 (no phone 9:16)", () => {
    assert.match(css, /\.landing-video-frame\s*\{[\s\S]*?aspect-ratio:\s*16\s*\/\s*9/);
    assert.equal(
      /\.landing-video-frame\s*\{[^}]*aspect-ratio:\s*9\s*\/\s*16/s.test(css),
      false,
      "no volver al marco 9:16; donjacobo.com.co usa 16:9",
    );
  });

  it("tone-promo bakery: peach sólido #f7dcd3 + texto #763200", () => {
    assert.match(css, /\.tone-promo[\s\S]*?background:\s*#f7dcd3\s*!important/);
    assert.match(css, /\.tone-promo[\s\S]*?color:\s*#763200/);
    assert.match(css, /\.landing-cta--bakery[\s\S]*?background:\s*#c7253c/);
  });

  it("hub-card: height auto (no clip WA) + gap entre cards", () => {
    assert.match(css, /\.hub-grid\s*\{[^}]*gap:\s*16px/s);
    assert.match(css, /\.hub-card\s*\{[\s\S]*?height:\s*auto/);
    assert.match(css, /\.hub-card[\s\S]*?& strong\s*\{[\s\S]*?line-height:\s*1\.3/);
  });
});

describe("Web Awesome / no Shoelace (docs/LLM.md)", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const js = readJsAll();

  it("CDN es @awesome.me/webawesome (no shoelace ni @webawesome-style)", () => {
    assert.match(html, /@awesome\.me\/webawesome@3/);
    assert.equal(/@shoelace-style\//.test(html), false, "quitar CDN Shoelace");
    assert.equal(/@webawesome-style\//.test(html), false, "paquete inventado; usar @awesome.me/webawesome");
  });

  it("JS/TSX no usa tags ni eventos sl-*", () => {
    assert.equal(/<\/?sl-[a-z]/.test(js), false, "usar wa-* no sl-*");
    assert.equal(/\bonsl-/.test(js), false, "eventos onsl-* → useWa / wa-*");
    assert.equal(/\buseSl\b/.test(js), false, "hook useSl renombrado a useWa");
  });
});

describe("Landing DJ drivers (docs/LLM.md)", () => {
  const drivers = readFileSync(join(jsDir, "components/SiteDrivers.tsx"), "utf8");

  it("feature-cards renderiza SplitPromo (no grid .feature-cards)", () => {
    assert.match(drivers, /case\s+"feature-cards"/);
    assert.match(drivers, /<SplitPromo/);
    const featCase = drivers.match(/case\s+"feature-cards":\s*\{[\s\S]*?case\s+"video"/);
    assert.ok(featCase, "bloque feature-cards incompleto");
    assert.match(featCase![0], /SplitPromo/);
    assert.equal(
      /className=["']feature-cards["']/.test(featCase![0]),
      false,
      "no volver al grid .feature-cards; son splits 50/50",
    );
    assert.match(featCase![0], /panelAlpha[\s\S]*?:\s*100/);
  });

  it("video usa landing-video-frame + CTA bakery", () => {
    const videoCase = drivers.match(/case\s+"video":\s*\{[\s\S]*?case\s+"footer-social"/);
    assert.ok(videoCase, "bloque video incompleto");
    assert.match(videoCase![0], /landing-video-frame/);
    assert.match(videoCase![0], /landing-cta--bakery/);
  });
});

describe("storage / conn isolation", () => {
  it("encodeConn/decodeConn redondea appId + storagePrefix", () => {
    const token = encodeConn({
      apiBase: "https://rio-go-clon.jeffaporta.workers.dev",
      appId: "donjacobo",
      storagePrefix: "donjacobo",
    });
    const back = decodeConnParam(token);
    assert.equal(back?.appId, "donjacobo");
    assert.equal(back?.storagePrefix, "donjacobo");
    assert.equal(back?.apiBase, "https://rio-go-clon.jeffaporta.workers.dev");
  });

  it("storageKey usa prefijo actual (default riogo hasta loadConfig)", () => {
    assert.equal(storageKey("cart"), "riogo:cart");
  });

  it("JS de tienda no lee cart/auth con claves globales riogo:/storefront:", () => {
    const forbidden = [
      /localStorage\.getItem\(\s*["']riogo:cart["']\s*\)/,
      /localStorage\.getItem\(\s*["']storefront:cart["']\s*\)/,
      /localStorage\.getItem\(\s*["']riogo:brand["']\s*\)/,
      /localStorage\.getItem\(\s*["']riogo:authJwt["']\s*\)/,
      /localStorage\.setItem\(\s*["']riogo:cart["']/,
    ];
    const files = walkTs(jsDir).filter((p) => !/[\\/]config\.ts$/.test(p));
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const re of forbidden) {
        assert.equal(re.test(src), false, `${file} viola aislamiento: ${re}`);
      }
    }
  });
});
