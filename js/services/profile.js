// js/services/profile.js
// A tela usa {nick, name, bio, color}; o back usa {nick, nomeCompleto, bio, cor}.
// IMPORTANTE: getProfile/updateProfile devolvem SÓ essas 4 chaves, porque a tela
// faz form.elements[chave] para cada chave do objeto salvo.
import { get, put } from "./http.js";
import { exigirId } from "./auth.js";

const paraTela = (p) => ({
  nick: p.nick ?? "",
  name: p.nomeCompleto ?? "",
  bio: p.bio ?? "",
  color: p.cor ?? "blue",
});

export async function getProfile() {
  return paraTela(await get(`/jogadores/${exigirId()}/perfil`));
}

export async function getStats() {
  const p = await get(`/jogadores/${exigirId()}/perfil`);
  return { wins: p.vitorias ?? 0, losses: p.derrotas ?? 0 };
}

// Erros do back que a tela já trata: NICK_INVALIDO, COR_INVALIDA
export async function updateProfile({ nick, name, bio, color }) {
  const p = await put(`/jogadores/${exigirId()}/perfil`, {
    nick, nomeCompleto: name, bio, cor: color,
  });
  return paraTela(p);
}
