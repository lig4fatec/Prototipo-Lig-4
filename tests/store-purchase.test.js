import assert from "node:assert/strict";
import { test } from "node:test";

// Armazenamento falso: simula o localStorage do navegador (compartilhado entre "recargas" de página).
const data = new Map();
const fakeStorage = {
  getItem: key => (data.has(key) ? data.get(key) : null),
  setItem: (key, value) => { data.set(key, String(value)); },
  removeItem: key => { data.delete(key); },
};
globalThis.localStorage = fakeStorage;
globalThis.window = { localStorage: fakeStorage };

const {
  equipItem,
  getBalance,
  getCatalog,
  getEquipped,
  getEquippedItems,
  getInventory,
  purchaseItem,
} = await import("../js/services/store.js");

function loginAs(email) {
  const accounts = JSON.parse(data.get("lig4.accounts") ?? "[]");
  if (!accounts.some(account => account.email === email)) {
    accounts.push({ id: email, email, password: "123456" });
  }
  data.set("lig4.accounts", JSON.stringify(accounts));
  data.set("lig4.currentUser", email);
}

async function ownedIds() {
  return (await getInventory()).items.map(item => item.id);
}

test("compra desconta o saldo e registra o item no inventário", async () => {
  loginAs("compra@teste.com");
  assert.deepEqual(await getBalance(), { coins: 1250 });

  const result = await purchaseItem({ category: "avatar", itemId: "avatar-robo" });

  assert.equal(result.item.id, "avatar-robo");
  assert.equal(result.item.owned, true);
  assert.deepEqual(result.balance, { coins: 450 });
  assert.deepEqual(await getBalance(), { coins: 450 });
  assert.ok((await ownedIds()).includes("avatar-robo"));

  const avatars = (await getCatalog()).categories.find(category => category.id === "avatar");
  assert.equal(avatars.items.find(item => item.id === "avatar-robo").owned, true);
  assert.equal(avatars.items.find(item => item.id === "avatar-samurai").owned, false);
  // Comprar não equipa automaticamente.
  assert.equal((await getEquipped()).avatar, "avatar-padrao");
});

test("compra duplicada é recusada sem nova cobrança", async () => {
  loginAs("duplicada@teste.com");
  await purchaseItem({ category: "emote", itemId: "emote-aplauso" });

  await assert.rejects(
    purchaseItem({ category: "emote", itemId: "emote-aplauso" }),
    { code: "ITEM_JA_POSSUIDO" },
  );
  assert.deepEqual(await getBalance(), { coins: 1050 });
  assert.equal((await getInventory()).purchased.filter(id => id === "emote-aplauso").length, 1);
});

test("itens do kit inicial não podem ser comprados", async () => {
  loginAs("kit@teste.com");
  await assert.rejects(
    purchaseItem({ category: "board", itemId: "board-classico" }),
    { code: "ITEM_JA_POSSUIDO" },
  );
  assert.deepEqual(await getBalance(), { coins: 1250 });
});

test("compra sem saldo suficiente é bloqueada", async () => {
  loginAs("pobre@teste.com");
  await purchaseItem({ category: "avatar", itemId: "avatar-samurai" });

  await assert.rejects(
    purchaseItem({ category: "board", itemId: "board-medieval" }),
    error => error.code === "SALDO_INSUFICIENTE" && error.missing === 750 && error.price === 1200,
  );
  assert.deepEqual(await getBalance(), { coins: 450 });
  assert.equal((await ownedIds()).includes("board-medieval"), false);
});

test("o saldo nunca fica negativo, mesmo ao gastar quase tudo", async () => {
  loginAs("exato@teste.com");
  await purchaseItem({ category: "board", itemId: "board-praia" }); // 1200 → 50
  assert.deepEqual(await getBalance(), { coins: 50 });
  await assert.rejects(
    purchaseItem({ category: "emote", itemId: "emote-bravo" }),
    { code: "SALDO_INSUFICIENTE" },
  );
  assert.equal((await getBalance()).coins >= 0, true);
});

test("item ou categoria inexistente é recusado", async () => {
  loginAs("inexistente@teste.com");
  await assert.rejects(purchaseItem({ category: "avatar", itemId: "avatar-fantasma" }), { code: "ITEM_INEXISTENTE" });
  await assert.rejects(purchaseItem({ category: "emote", itemId: "avatar-rei" }), { code: "ITEM_INEXISTENTE" });
  await assert.rejects(purchaseItem({}), { code: "ITEM_INEXISTENTE" });
  assert.deepEqual(await getBalance(), { coins: 1250 });
});

test("item comprado pode ser equipado; item não comprado não", async () => {
  loginAs("equipar@teste.com");
  await assert.rejects(equipItem({ category: "board", itemId: "board-inverno" }), { code: "ITEM_NAO_POSSUIDO" });

  await purchaseItem({ category: "board", itemId: "board-espacial" });
  await equipItem({ category: "board", itemId: "board-espacial" });

  assert.equal((await getEquipped()).board, "board-espacial");
  const equippedItems = await getEquippedItems();
  assert.equal(equippedItems.board.id, "board-espacial");
  assert.equal(equippedItems.board.frame.file, "boards/espacial-frame.webp");
  assert.equal(equippedItems.avatar.id, "avatar-padrao");
});

test("compras e equipamentos persistem após recarregar a página", async () => {
  loginAs("persiste@teste.com");
  await purchaseItem({ category: "avatar", itemId: "avatar-samurai" });
  await equipItem({ category: "avatar", itemId: "avatar-samurai" });

  // Nova instância do módulo = página recarregada, lendo o mesmo armazenamento.
  const reloaded = await import("../js/services/store.js?recarregado");
  assert.deepEqual(await reloaded.getBalance(), { coins: 450 });
  assert.equal((await reloaded.getEquipped()).avatar, "avatar-samurai");
  assert.ok((await reloaded.getInventory()).items.some(item => item.id === "avatar-samurai"));
});

test("cada jogador tem saldo, inventário e preferências próprios", async () => {
  loginAs("ana@teste.com");
  await purchaseItem({ category: "avatar", itemId: "avatar-mago" });
  await equipItem({ category: "avatar", itemId: "avatar-mago" });

  loginAs("bia@teste.com");
  assert.deepEqual(await getBalance(), { coins: 1250 });
  assert.equal((await ownedIds()).includes("avatar-mago"), false);
  assert.equal((await getEquipped()).avatar, "avatar-padrao");
  await assert.rejects(equipItem({ category: "avatar", itemId: "avatar-mago" }), { code: "ITEM_NAO_POSSUIDO" });

  loginAs("ana@teste.com");
  assert.deepEqual(await getBalance(), { coins: 50 });
  assert.equal((await getEquipped()).avatar, "avatar-mago");
});

test("compras simultâneas do mesmo item cobram uma única vez", async () => {
  loginAs("corrida@teste.com");
  const results = await Promise.allSettled([
    purchaseItem({ category: "avatar", itemId: "avatar-rei" }),
    purchaseItem({ category: "avatar", itemId: "avatar-rei" }),
  ]);

  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.find(result => result.status === "rejected").reason.code, "ITEM_JA_POSSUIDO");
  assert.deepEqual(await getBalance(), { coins: 50 });
});

test("dados corrompidos no armazenamento voltam ao estado inicial seguro", async () => {
  loginAs("corrompido@teste.com");
  data.set("lig4.store", JSON.stringify({
    "corrompido@teste.com": { coins: -5, purchased: ["avatar-rei", "item-falso", "avatar-padrao"], equipped: { avatar: "avatar-mago", board: "board-fake" } },
  }));

  assert.deepEqual(await getBalance(), { coins: 1250 });
  assert.deepEqual((await getInventory()).purchased, ["avatar-rei"]);
  assert.deepEqual(await getEquipped(), { avatar: "avatar-padrao", board: "board-classico", emote: "emote-risadinha" });
});
