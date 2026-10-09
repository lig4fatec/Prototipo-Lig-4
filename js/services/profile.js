// Mock em memória do perfil e estatísticas; não persiste entre recarregamentos.
import { CORES_VALIDAS } from "./rooms.js";

let profile = {
  nick: "Vini",
  name: "Vinícius Silva",
  bio: "Pronto para a próxima partida.",
  color: "blue",
};

const stats = { wins: 4, losses: 3 };

function profileError(code) {
  return { code };
}

async function yieldMock() {
  await Promise.resolve();
}

export async function getProfile() {
  await yieldMock();
  return { ...profile };
}

export async function updateProfile({ nick, name, bio, color } = {}) {
  await yieldMock();
  const normalizedNick = typeof nick === "string" ? nick.trim() : "";
  if (!normalizedNick || normalizedNick.length > 20) {
    throw profileError("NICK_INVALIDO");
  }
  if (!CORES_VALIDAS.includes(color)) {
    throw profileError("COR_INVALIDA");
  }

  profile = {
    nick: normalizedNick,
    name: typeof name === "string" ? name.trim() : profile.name,
    bio: typeof bio === "string" ? bio.trim() : profile.bio,
    color,
  };
  return { ...profile };
}

export async function getStats() {
  await yieldMock();
  return { ...stats };
}