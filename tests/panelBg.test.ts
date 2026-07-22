import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { panelBg } from "../js/panelBg.ts";

describe("panelBg", () => {
  it("mezcla color con --rg-bg al % pedido", () => {
    assert.equal(panelBg("#c7253c", 90), "color-mix(in srgb, #c7253c 90%, var(--rg-bg))");
    assert.equal(panelBg("#f7dcd3", 90), "color-mix(in srgb, #f7dcd3 90%, var(--rg-bg))");
  });

  it("no re-envuelve color-mix / var existentes", () => {
    const already = "color-mix(in srgb, red 80%, blue)";
    assert.equal(panelBg(already), already);
  });
});
