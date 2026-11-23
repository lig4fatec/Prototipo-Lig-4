// js/services/history.js
// A tela espera {matches:[{date, opponent, result, moves, mode}]}.
import { get } from "./http.js";
import { exigirId } from "./auth.js";

// O back só filtra por modo. Qualquer outro filtro (ex.: "diario") daria FILTRO_INVALIDO.
const FILTROS_DO_BACK = new Set(["todos", "classico", "caos"]);
const RESULTADO = { VITORIA: "win", DERROTA: "loss", EMPATE: "draw" };
const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export async function listMatches({ filter = "todos", query = "" } = {}) {
  if (!FILTROS_DO_BACK.has(filter)) return { matches: [] };

  const r = await get(`/jogadores/${exigirId()}/historico?filtro=${encodeURIComponent(filter)}`);
  let matches = (r.partidas ?? []).map((p) => ({
    id: p.id,
    date: p.data,
    opponent: p.adversario,
    result: RESULTADO[p.resultado] ?? "loss",
    moves: p.jogadas,
    mode: String(p.modo ?? "").toLowerCase(), // CLASSICO -> classico, CAOS -> caos
  }));

  // O back não pesquisa por texto: filtra aqui pelo nome do adversário.
  const q = normalizar(query.trim());
  if (q) matches = matches.filter((m) => normalizar(m.opponent).includes(q));
  return { matches };
}
