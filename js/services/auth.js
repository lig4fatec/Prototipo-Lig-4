const ACCOUNTS_KEY = "lig4.accounts";
const CURRENT_USER_KEY = "lig4.currentUser";

function createAuthError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    throw createAuthError("ARMAZENAMENTO_INDISPONIVEL");
  }
}

function readAccounts(storage) {
  let serializedAccounts;
  try {
    serializedAccounts = storage.getItem(ACCOUNTS_KEY);
  } catch {
    throw createAuthError("ARMAZENAMENTO_INDISPONIVEL");
  }
  if (!serializedAccounts) return [];

  try {
    const accounts = JSON.parse(serializedAccounts);
    if (!Array.isArray(accounts)) throw new Error();
    return accounts;
  } catch {
    throw createAuthError("DADOS_DE_AUTENTICACAO_INVALIDOS");
  }
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublicUser(account) {
  return { id: account.id, email: account.email };
}

export async function register(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) throw createAuthError("EMAIL_INVALIDO");
  if (typeof password !== "string" || password.length < 6) {
    throw createAuthError("SENHA_INVALIDA");
  }

  const storage = getStorage();
  const accounts = readAccounts(storage);
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw createAuthError("EMAIL_JA_CADASTRADO");
  }

  const account = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    email: normalizedEmail,
    password,
  };

  try {
    storage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    storage.setItem(CURRENT_USER_KEY, account.email);
  } catch {
    throw createAuthError("ARMAZENAMENTO_INDISPONIVEL");
  }

  return toPublicUser(account);
}

export async function login(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const storage = getStorage();
  const account = readAccounts(storage).find(
    (candidate) => candidate.email === normalizedEmail && candidate.password === password,
  );

  if (!account) throw createAuthError("CREDENCIAIS_INVALIDAS");

  try {
    storage.setItem(CURRENT_USER_KEY, account.email);
  } catch {
    throw createAuthError("ARMAZENAMENTO_INDISPONIVEL");
  }

  return toPublicUser(account);
}

export async function logout() {
  const storage = getStorage();
  try {
    storage.removeItem(CURRENT_USER_KEY);
  } catch {
    throw createAuthError("ARMAZENAMENTO_INDISPONIVEL");
  }
}

export async function getCurrentUser() {
  const storage = getStorage();
  let currentEmail;
  try {
    currentEmail = storage.getItem(CURRENT_USER_KEY);
  } catch {
    throw createAuthError("ARMAZENAMENTO_INDISPONIVEL");
  }
  if (!currentEmail) return null;

  const account = readAccounts(storage).find((candidate) => candidate.email === currentEmail);
  return account ? toPublicUser(account) : null;
}
