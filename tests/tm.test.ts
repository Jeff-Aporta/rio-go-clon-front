import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tmHtml } from "../js/tm-html.ts";

describe("tmHtml", () => {
  it("envuelve ® en sup.rg-tm", () => {
    assert.equal(tmHtml("Genovesas®"), 'Genovesas<sup class="rg-tm">®</sup>');
    assert.equal(tmHtml("GENOVESA® CERO"), 'GENOVESA<sup class="rg-tm">®</sup> CERO');
  });

  it("sin ® no cambia", () => {
    assert.equal(tmHtml("hola"), "hola");
  });
});
