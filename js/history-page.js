import { listMatches } from "./services/history.js";

const filters = [...document.querySelectorAll("[data-history-filter]")];
const list = document.querySelector("[data-history-list]");
const status = document.querySelector("[data-history-status]");
const search = document.querySelector("[data-history-search]");
const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const modeNames = { classico: "Clássico", caos: "Caos" };
const resultNames = { win: "Vitória", loss: "Derrota", draw: "Empate" };
let activeFilter = "todos";
let searchTimer = null;

function makeCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}
function renderMatches(matches) {
  list.replaceChildren(...matches.map(match => {
    const row = document.createElement("tr");
    const resultCell = makeCell(resultNames[match.result] || "Derrota", "history-result");
    resultCell.dataset.result = match.result;
    row.append(
      makeCell(dateFormat.format(new Date(match.date))),
      makeCell(match.opponent),
      resultCell,
      makeCell(String(match.moves)),
      makeCell(modeNames[match.mode] || match.mode)
    );
    return row;
  }));
  status.textContent = matches.length ? "" : "Nenhuma partida registrada.";
}
async function loadMatches() {
  status.textContent = "Carregando partidas...";
  try {
    const result = await listMatches({ filter: activeFilter, query: search.value });
    renderMatches(result.matches);
  } catch {
    list.replaceChildren();
    status.textContent = "Não foi possível carregar o histórico.";
  }
}
for (const button of filters) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.historyFilter;
    filters.forEach(item => item.setAttribute("aria-selected", String(item === button)));
    loadMatches();
  });
}
search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadMatches, 180);
});
loadMatches();
