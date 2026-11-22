// js/services/http.js — fetch com tratamento de erro padrão do back
// O back sempre responde erro como {"codigo":"...","mensagem":"..."}.
import { API_URL } from "../config.js";

export class ApiError extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem || codigo || "Erro na API");
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.code = codigo; // alias: as telas atuais podem usar err.code
  }
}

export async function http(metodo, caminho, corpo) {
  let res;
  try {
    res = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError(0, "SEM_CONEXAO", "Não foi possível falar com o servidor.");
  }
  if (res.status === 204) return null;

  let dados = null;
  try { dados = await res.json(); } catch { /* corpo vazio */ }

  if (!res.ok) throw new ApiError(res.status, dados?.codigo, dados?.mensagem);
  return dados;
}

export const get = (caminho) => http("GET", caminho);
export const post = (caminho, corpo = {}) => http("POST", caminho, corpo);
export const put = (caminho, corpo = {}) => http("PUT", caminho, corpo);
