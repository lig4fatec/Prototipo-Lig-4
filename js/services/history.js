// Mock de partidas para demonstração; os filtros refletem os modos do jogo.
const matches = [
  { id: "match-001", date: "2026-11-08T19:30:00-03:00", opponent: "Marina", result: "win", moves: 28, mode: "classico" },
  { id: "match-002", date: "2026-11-08T18:10:00-03:00", opponent: "Rafael", result: "loss", moves: 34, mode: "caos" },
  { id: "match-003", date: "2026-11-07T20:15:00-03:00", opponent: "Camila", result: "win", moves: 25, mode: "classico" },
  { id: "match-004", date: "2026-11-07T18:45:00-03:00", opponent: "João", result: "win", moves: 31, mode: "caos" },
  { id: "match-005", date: "2026-11-06T21:05:00-03:00", opponent: "Lucas", result: "loss", moves: 22, mode: "classico" },
];

const VALID_FILTERS = new Set(["todos", "classico", "caos"]);
export async function listMatches({ filter = "todos", query = "" } = {}) {
  await Promise.resolve();
  if (!VALID_FILTERS.has(filter)) throw { code: "FILTRO_INVALIDO" };
  const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const term = normalize(query.trim());
  const selected = matches.filter(match => {
    if (filter !== "todos" && match.mode !== filter) return false;
    if (!term) return true;
    const mode = match.mode === "classico" ? "clássico" : "caos";
    const result = match.result === "win" ? "vitória" : "derrota";
    const date = new Date(match.date).toLocaleDateString("pt-BR");
    return normalize(`${match.opponent} ${mode} ${result} ${date}`).includes(term);
  });
  return { matches: selected.map(match => ({ ...match })) };
}
