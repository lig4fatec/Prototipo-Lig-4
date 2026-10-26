import assert from "node:assert/strict";
import { test } from "node:test";
import { GAME_MODES, getGameMode, isValidGameMode } from "../js/game/modes.js";
import { getCatalog, purchaseItem, equipItem } from "../js/services/store.js";

test("modos incluem clássico, caos e inverno", () => {
  for (const mode of ["classico", "caos", "inverno"]) assert.equal(isValidGameMode(mode), true);
  assert.equal(isValidGameMode("invalido"), false);
  assert.equal(getGameMode("inverno").boardId, "board-inverno");
  assert.equal(getGameMode("invalido").id, "classico");
});
test("tabuleiros não aparecem na loja nem podem ser comprados/equipados", async () => {
  const catalog = await getCatalog();
  assert.deepEqual(catalog.categories.map(c => c.id), ["avatar", "emote"]);
  await assert.rejects(purchaseItem({ category: "board", itemId: "board-inverno" }), { code: "ITEM_INDISPONIVEL" });
  await assert.rejects(equipItem({ category: "board", itemId: "board-classico" }), { code: "ITEM_INDISPONIVEL" });
});
