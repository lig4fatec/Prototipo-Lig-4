// Mock em memória de partidas; não persiste entre recarregamentos.
const matches = [
  { id: "match-001", date: "2026-10-08T19:30:00-03:00", opponent: "Marina", result: "win", moves: 28, mode: "online" },
  { id: "match-002", date: "2026-10-08T18:10:00-03:00", opponent: "Rafael", result: "loss", moves: 34, mode: "online" },
  { id: "match-003", date: "2026-10-07T20:15:00-03:00", opponent: "Desafio diário", result: "win", moves: 25, mode: "diario" },
  { id: "match-004", date: "2026-10-07T18:45:00-03:00", opponent: "Camila", result: "win", moves: 31, mode: "online" },
  { id: "match-005", date: "2026-10-06T21:05:00-03:00", opponent: "João", result: "loss", moves: 22, mode: "online" },
  { id: "match-006", date: "2026-10-05T19:00:00-03:00", opponent: "Lucas", result: "win", moves: 30, mode: "online" },
  { id: "match-007", date: "2026-10-04T20:40:00-03:00", opponent: "Desafio diário", result: "loss", moves: 27, mode: "diario" },
];

const VALID_FILTERS = new Set(["todos", "online", "diario"]);

export async function listMatches({ filter = "todos" } = {}) {
  await Promise.resolve();
  if (!VALID_FILTERS.has(filter)) throw { code: "FILTRO_INVALIDO" };

  const selected = filter === "todos"
    ? matches
    : matches.filter(match => match.mode === filter);
  return { matches: selected.map(match => ({ ...match })) };
}