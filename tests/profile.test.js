import assert from "node:assert/strict";
import { test } from "node:test";
import { getProfile, getStats, updateProfile } from "../js/services/profile.js";

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};

test("updateProfile rejeita nick vazio", async () => {
  const profile = await getProfile();
  await assert.rejects(
    updateProfile({ ...profile, nick: "   " }),
    { code: "NICK_INVALIDO" },
  );
});

test("updateProfile rejeita cor inválida", async () => {
  const profile = await getProfile();
  await assert.rejects(
    updateProfile({ ...profile, color: "turquoise" }),
    { code: "COR_INVALIDA" },
  );
});

test("updateProfile aceita dados válidos", async () => {
  const updated = await updateProfile({
    nick: "  Jogadora  ",
    name: "Ana Silva",
    bio: "Minha bio",
    color: "purple",
  });

  assert.deepEqual(updated, {
    nick: "Jogadora",
    name: "Ana Silva",
    bio: "Minha bio",
    color: "purple",
  });
  assert.deepEqual(await getStats(), { wins: 0, losses: 0 });
});