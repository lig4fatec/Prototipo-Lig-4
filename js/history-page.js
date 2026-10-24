import { listMatches } from "./services/history.js";

const filters = [...document.querySelectorAll("[data-history-filter]")];
const list = document.querySelector("[data-history-list]");
const status = document.querySelector("[data-history-status]");
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const modeNames = { online: "Online", diario: "Diário" };

function makeCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderMatches(matches) {
  list.replaceChildren(...matches.map(match => {
    const row = document.createElement("tr");
    const resultCell = makeCell(match.result === "win" ? "Vitória" : "Derrota", "history-result");
    resultCell.dataset.result = match.result;
    row.append(
      makeCell(dateFormat.format(new Date(match.date))),
      makeCell(match.opponent),
      resultCell,
      makeCell(String(match.moves)),
      makeCell(modeNames[match.mode] || match.mode),
    );
    return row;
  }));
  status.textContent = matches.length ? "" : "Nenhuma partida neste filtro.";
}

async function loadMatches(filter) {
  status.textContent = "Carregando partidas...";
  try {
    const result = await listMatches({ filter });
    renderMatches(result.matches);
  } catch (error) {
    list.replaceChildren();
    status.textContent = error.code === "FILTRO_INVALIDO"
      ? "Filtro inválido."
      : "Não foi possível carregar o histórico.";
  }
}

for (const button of filters) {
  button.addEventListener("click", () => {
    for (const filterButton of filters) {
      filterButton.setAttribute("aria-selected", String(filterButton === button));
    }
    loadMatches(button.dataset.historyFilter);
  });
}

loadMatches("todos");