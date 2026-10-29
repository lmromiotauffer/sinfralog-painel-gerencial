import { test } from "node:test";
import assert from "node:assert/strict";
import { mesclarPaginaObras } from "./mesclarPaginaObras.ts";

const obras = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (lista: { id: string }[]) => lista.map((obra) => obra.id);

test("mesclarPaginaObras: filtro sem resultado esvazia a lista", () => {
  assert.deepEqual(mesclarPaginaObras(obras("a", "b"), [], 0), []);
});

test("mesclarPaginaObras: filtro que mantém as primeiras obras ainda tira as que saíram", () => {
  const rolada = mesclarPaginaObras(obras("a", "b", "c", "d", "e"), obras("f", "g"), 1000);
  assert.deepEqual(ids(mesclarPaginaObras(rolada, obras("a", "b", "c", "d", "e"), 0)), ["a", "b", "c", "d", "e"]);
});

test("mesclarPaginaObras: página seguinte acrescenta só obras novas", () => {
  const anteriores = obras("a", "b");
  assert.deepEqual(ids(mesclarPaginaObras(anteriores, obras("b", "c"), 1000)), ["a", "b", "c"]);
  assert.equal(mesclarPaginaObras(anteriores, obras("a"), 1000), anteriores);
});
