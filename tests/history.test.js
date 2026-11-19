import assert from "node:assert/strict";
import { test } from "node:test";
import { listMatches } from "../js/services/history.js";

test("listMatches rejeita filtro inválido", async () => {
  await assert.rejects(listMatches({ filter: "favoritos" }), { code: "FILTRO_INVALIDO" });
});

test("listMatches mantém o histórico vazio", async () => {
  const classic = await listMatches({ filter: "classico" });
  const chaos = await listMatches({ filter: "caos" });
  const search = await listMatches({ query: "qualquer adversário" });
  const all = await listMatches({ filter: "todos" });
  assert.deepEqual(classic.matches, []);
  assert.deepEqual(chaos.matches, []);
  assert.deepEqual(search.matches, []);
  assert.deepEqual(all.matches, []);
});
