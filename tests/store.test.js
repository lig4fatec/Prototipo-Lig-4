import assert from "node:assert/strict";
import { test } from "node:test";
import { equipItem, getCatalog, getEquipped } from "../js/services/store.js";

test("equipItem rejeita item não possuído", async () => {
  await assert.rejects(
    equipItem({ category: "avatar", itemId: "avatar-orbita" }),
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
  await equipItem({ category: "avatar", itemId: "avatar-folhas" });

  assert.equal((await getEquipped()).avatar, "avatar-folhas");
  const catalog = await getCatalog();
  assert.equal(catalog.categories.length, 3);
  assert.equal(catalog.categories.every(category => category.items.length === 4), true);
});