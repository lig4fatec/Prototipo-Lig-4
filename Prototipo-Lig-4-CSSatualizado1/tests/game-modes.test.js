import assert from "node:assert/strict";
import { test } from "node:test";
import { GAME_MODES, getGameMode, isValidGameMode } from "../js/game/modes.js";
import { getCatalog, purchaseItem, equipItem } from "../js/services/store.js";

test("os modos disponíveis são apenas clássico e caos", () => {
  assert.deepEqual(GAME_MODES.map(mode => mode.id), ["classico", "caos"]);
  for (const mode of ["classico", "caos"]) assert.equal(isValidGameMode(mode), true);
  assert.equal(isValidGameMode("inverno"), false);
  assert.equal(getGameMode("invalido").id, "classico");
});
test("tabuleiros especiais aparecem na loja, podem ser comprados e equipados", async () => {
  const catalog = await getCatalog();
  assert.deepEqual(catalog.categories.map(c => c.id), ["avatar", "board", "emote"]);
  assert.deepEqual(catalog.categories.find(c => c.id === "board").items.map(item => item.id),
    ["board-espacial", "board-floresta", "board-medieval", "board-praia", "board-inverno"]);
  await purchaseItem({ category: "board", itemId: "board-inverno" });
  await equipItem({ category: "board", itemId: "board-inverno" });
});
