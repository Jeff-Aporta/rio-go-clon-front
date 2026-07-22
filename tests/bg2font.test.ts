import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bg2font, oklchL } from "../js/bg2font.ts";

describe("bg2font (OKLCH)", () => {
  it("ámbar RioGo → texto oscuro", () => {
    assert.ok((oklchL("#f5a623") ?? 0) > 0.65);
    assert.equal(bg2font("#f5a623"), "#14110f");
  });

  it("rojo Don Jacobo → texto claro", () => {
    assert.ok((oklchL("#c7253c") ?? 1) <= 0.65);
    assert.equal(bg2font("#c7253c"), "#ffffff");
  });

  it("blanco → oscuro; negro → blanco", () => {
    assert.equal(bg2font("#ffffff"), "#14110f");
    assert.equal(bg2font("#111111"), "#ffffff");
  });

  it("acepta #rgb y rgb()", () => {
    assert.equal(bg2font("#fff"), "#14110f");
    assert.equal(bg2font("rgb(199, 37, 60)"), "#ffffff");
  });

  it("color inválido → light por defecto", () => {
    assert.equal(bg2font("nope"), "#ffffff");
  });
});
