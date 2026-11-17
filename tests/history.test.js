import assert from "node:assert/strict";
import { test } from "node:test";
import { listMatches } from "../js/services/history.js";

test("listMatches rejeita filtro inválido", async () => {
  await assert.rejects(listMatches({ filter: "favoritos" }), { code: "FILTRO_INVALIDO" });
});

test("listMatches filtra por modo e texto", async () => {
  const classic = await listMatches({ filter: "classico" });
  const chaos = await listMatches({ filter: "caos" });
  const search = await listMatches({ query: "Marina" });
  const all = await listMatches({ filter: "todos" });
  assert.ok(classic.matches.length > 0);
  assert.ok(classic.matches.every(match => match.mode === "classico"));
  assert.ok(chaos.matches.length > 0);
  assert.ok(chaos.matches.every(match => match.mode === "caos"));
  assert.equal(search.matches.length, 1);
  assert.equal(all.matches.length, 5);
});
