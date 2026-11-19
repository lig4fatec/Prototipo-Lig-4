const matches = [];

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
