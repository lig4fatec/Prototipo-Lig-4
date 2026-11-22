import { API_URL } from "../config.js";

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.mensagem || "Erro ao comunicar com o servidor.");
    error.code = data?.codigo || "ERRO_INTERNO";
    error.status = response.status;
    throw error;
  }

  return data;
}