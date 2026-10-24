import { getCurrentUser } from "./auth.js";
import { CORES_VALIDAS } from "./rooms.js";

const PROFILES_KEY = "lig4.profiles";
const STATS_KEY = "lig4.stats";

function createProfileError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

async function getUserKey() {
  const user = await getCurrentUser();
  return user?.email ?? "visitante";
}

function defaultNick(userKey) {
  return userKey.split("@")[0];
}

export async function getProfile() {
  const userKey = await getUserKey();
  const saved = readJson(PROFILES_KEY)[userKey] ?? {};
  return {
    nick: saved.nick ?? defaultNick(userKey),
    name: saved.name ?? "",
    bio: saved.bio ?? "",
    color: saved.color ?? "blue",
  };
}

export async function getStats() {
  const userKey = await getUserKey();
  const saved = readJson(STATS_KEY)[userKey] ?? {};
  return {
    wins: saved.wins ?? 0,
    losses: saved.losses ?? 0,
  };
}

export async function updateProfile(changes) {
  const nick = typeof changes.nick === "string" ? changes.nick.trim() : "";
  if (!nick || nick.length > 20) throw createProfileError("NICK_INVALIDO");
  if (!CORES_VALIDAS.includes(changes.color)) throw createProfileError("COR_INVALIDA");

  const userKey = await getUserKey();
  const profile = {
    nick,
    name: (changes.name ?? "").trim(),
    bio: (changes.bio ?? "").trim(),
    color: changes.color,
  };

  try {
    const profiles = readJson(PROFILES_KEY);
    profiles[userKey] = profile;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    throw createProfileError("ARMAZENAMENTO_INDISPONIVEL");
  }

  return profile;
}