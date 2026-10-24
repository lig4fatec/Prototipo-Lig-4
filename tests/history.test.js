import assert from "node:assert/strict";
import { test } from "node:test";
import { listMatches } from "../js/services/history.js";

test("listMatches rejeita filtro inválido", async () => {
  await assert.rejects(listMatches({ filter: "favoritos" }), { code: "FILTRO_INVALIDO" });
});

test("listMatches retorna apenas partidas do filtro solicitado", async () => {
  const online = await listMatches({ filter: "online" });
  const daily = await listMatches({ filter: "diario" });
  const all = await listMatches({ filter: "todos" });

  assert.ok(online.matches.length > 0);
  assert.ok(online.matches.every(match => match.mode === "online"));
  assert.ok(daily.matches.length > 0);
  assert.ok(daily.matches.every(match => match.mode === "diario"));
  assert.equal(all.matches.length, 7);
});