import assert from "node:assert/strict";
import { test } from "node:test";
import { equipItem, getCatalog, getEquipped } from "../js/services/store.js";

test("equipItem rejeita item não possuído", async () => {
  await assert.rejects(
    equipItem({ category: "avatar", itemId: "avatar-samurai" }),
    { code: "ITEM_NAO_POSSUIDO" },
  );
});

test("equipItem rejeita item inexistente", async () => {
  await assert.rejects(
    equipItem({ category: "avatar", itemId: "avatar-inexistente" }),
    { code: "ITEM_INEXISTENTE" },
  );
});

test("equipItem aceita item possuído e atualiza equipamento", async () => {
  await equipItem({ category: "avatar", itemId: "avatar-padrao" });

  assert.equal((await getEquipped()).avatar, "avatar-padrao");
  const catalog = await getCatalog();
  assert.equal(catalog.categories.length, 2);
  assert.deepEqual(catalog.categories.map(category => category.items.length), [6, 8]);
});