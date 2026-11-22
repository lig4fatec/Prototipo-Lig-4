// js/services/auth.js — login, cadastro e sessão via API
// Exporta o que as telas já usam: login, cadastro, getCurrentUser, logout.
// Códigos de erro do back: CREDENCIAIS_INVALIDAS (401), EMAIL_JA_CADASTRADO (409),
// EMAIL_INVALIDO, SENHA_INVALIDA, NICK_INVALIDO (400). Falha de rede: SEM_CONEXAO.
import { post, ApiError } from "./http.js";

// AJUSTAR se o mock usava outra chave de sessão no localStorage.
const CHAVE_SESSAO = "lig4-sessao";

function salvarSessao(jogador) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(jogador));
}

export function jogadorLogado() {
  try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
}

// Sem token: o back identifica o jogador pelo id, que o front envia nas chamadas.
export function exigirId() {
  const id = jogadorLogado()?.id;
  if (id == null) throw new ApiError(401, "NAO_AUTENTICADO", "Faça login para continuar.");
  return id;
}

export async function getCurrentUser() {
  return jogadorLogado(); // {id, nome, email, criadoEm, cor} ou null
}

export async function logout() {
  localStorage.removeItem(CHAVE_SESSAO);
}
export const sair = logout;

// Aceita login(email, senha) ou login({ email, senha })
export async function login(arg, senhaPos) {
  const { email, senha } = typeof arg === "object" ? arg : { email: arg, senha: senhaPos };
  const jogador = await post("/auth/login", { email, senha });
  salvarSessao(jogador);
  return jogador;
}

// Aceita cadastro(email, senha, nick) ou cadastro({ email, senha, nick })
// senha: 6 a 72 caracteres; nick opcional, de 3 a 20
export async function cadastro(arg, senhaPos, nickPos) {
  const o = typeof arg === "object" ? arg : { email: arg, senha: senhaPos, nick: nickPos };
  const corpo = { email: o.email, senha: o.senha };
  const nick = o.nick ?? o.nome ?? o.name;
  if (nick) corpo.nick = nick;
  const jogador = await post("/auth/cadastro", corpo);
  salvarSessao(jogador);
  return jogador;
}
