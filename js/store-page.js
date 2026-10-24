import { logout } from "./services/auth.js";
import { equipItem, getBalance, getCatalog, getEquipped } from "./services/store.js";

const tabButtons = [...document.querySelectorAll("[data-store-tab]")];
const sections = [...document.querySelectorAll("[data-store-section]")];
const balanceElement = document.querySelector("[data-store-balance]");
const messageElement = document.querySelector("[data-store-message]");
const numberFormat = new Intl.NumberFormat("pt-BR");
let equipped = {};

function setMessage(message, isError = false) {
  messageElement.textContent = message;
  messageElement.dataset.state = isError ? "error" : "";
}

function setActiveTab(category) {
  for (const button of tabButtons) {
    const isActive = button.dataset.storeTab === category;
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  }
}

function makeCoinIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("aria-hidden", "true");
  icon.classList.add("store-coin-icon");

  const outer = document.createElementNS(icon.namespaceURI, "circle");
  outer.setAttribute("cx", "12");
  outer.setAttribute("cy", "12");
  outer.setAttribute("r", "9");
  outer.setAttribute("stroke", "currentColor");
  outer.setAttribute("stroke-width", "2");

  const inner = document.createElementNS(icon.namespaceURI, "circle");
  inner.setAttribute("cx", "12");
  inner.setAttribute("cy", "12");
  inner.setAttribute("r", "3");
  inner.setAttribute("fill", "currentColor");

  icon.append(outer, inner);
  return icon;
}

function makePreview(categoryId, name) {
  const preview = document.createElement("div");
  preview.className = `store-card__preview store-card__preview--${categoryId}`;
  preview.setAttribute("aria-hidden", "true");

  if (categoryId === "board") {
    const board = document.createElement("span");
    board.className = "store-card__board";
    for (let cell = 0; cell < 42; cell++) {
      const hole = document.createElement("span");
      hole.className = "store-card__board-hole";
      board.append(hole);
    }
    preview.append(board);
  } else {
    const mark = document.createElement("span");
    mark.className = "store-card__mark";
    mark.textContent = categoryId === "emote" ? name.slice(0, 2).toUpperCase() : name.slice(0, 1).toUpperCase();
    preview.append(mark);
  }

  return preview;
}

function renderItem(category, item) {
  const listItem = document.createElement("li");
  listItem.className = "store-grid__item";

  const card = document.createElement("article");
  card.className = "ui-card store-card";
  card.append(makePreview(category.id, item.name));

  const details = document.createElement("div");
  details.className = "store-card__details";

  const name = document.createElement("h3");
  name.className = "store-card__name";
  name.textContent = item.name;

  const meta = document.createElement("div");
  meta.className = "store-card__meta";

  const status = document.createElement("span");
  status.className = "ui-status";
  if (equipped[category.id] === item.id) {
    status.textContent = "Equipado";
    status.dataset.state = "equipped";
  } else if (item.owned) {
    status.textContent = "Disponível";
    status.dataset.state = "available";
  } else {
    status.textContent = "Bloqueado";
    status.dataset.state = "locked";
  }
  meta.append(status);

  if (item.price > 0) {
    const price = document.createElement("span");
    price.className = "store-card__price";
    price.append(makeCoinIcon(), document.createTextNode(numberFormat.format(item.price)));
    meta.append(price);
  } else if (item.owned) {
    const free = document.createElement("span");
    free.className = "store-card__price store-card__price--free";
    free.textContent = "Grátis";
    meta.append(free);
  }

  details.append(name, meta);

  if (item.owned && equipped[category.id] !== item.id) {
    const equipButton = document.createElement("button");
    equipButton.className = "button button-primary-dark store-card__action";
    equipButton.type = "button";
    equipButton.textContent = "Equipar";
    equipButton.addEventListener("click", async () => {
      equipButton.disabled = true;
      setMessage("");
      try {
        equipped = await equipItem({ category: category.id, itemId: item.id });
        renderCategory(category);
        setMessage(`${item.name} equipado.`);
      } catch (error) {
        setMessage(error.code === "ITEM_NAO_POSSUIDO" ? "Este item não está disponível na sua coleção." : "Não foi possível equipar este item.", true);
      }
    });
    details.append(equipButton);
  }

  card.append(details);
  listItem.append(card);
  return listItem;
}

function renderCategory(category) {
  const list = document.querySelector(`[data-store-items="${category.id}"]`);
  if (!list) return;
  list.replaceChildren(...category.items.map(item => renderItem(category, item)));
}

function observeSections() {
  if (!("IntersectionObserver" in window)) return;
  const headings = sections
    .map(section => section.querySelector(".store-section__heading"))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    const activeHeading = entries
      .filter(entry => entry.isIntersecting)
      .sort((first, second) => Math.abs(first.boundingClientRect.top - 120) - Math.abs(second.boundingClientRect.top - 120))[0];
    const section = activeHeading?.target.closest("[data-store-section]");
    if (section) setActiveTab(section.dataset.storeSection);
  }, {
    rootMargin: "-120px 0px -70% 0px",
    threshold: 0,
  });

  headings.forEach(heading => observer.observe(heading));
}

for (const button of tabButtons) {
  button.addEventListener("click", () => {
    const section = document.getElementById(button.getAttribute("aria-controls"));
    setActiveTab(button.dataset.storeTab);
    section?.scrollIntoView({ behavior: "auto", block: "start" });
  });

  button.addEventListener("keydown", event => {
    const currentIndex = tabButtons.indexOf(button);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabButtons.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabButtons.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    tabButtons[nextIndex].focus();
    tabButtons[nextIndex].click();
  });
}

document.querySelector("[data-store-logout]").addEventListener("click", async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await logout();
    window.location.assign("./t01-boas-vindas.html");
  } catch {
    button.disabled = false;
    setMessage("Não foi possível sair agora. Tente novamente.", true);
  }
});

async function initializeStore() {
  try {
    const [catalog, balance, currentEquipped] = await Promise.all([
      getCatalog(),
      getBalance(),
      getEquipped(),
    ]);
    equipped = currentEquipped;
    balanceElement.textContent = numberFormat.format(balance.coins);
    for (const category of catalog.categories) renderCategory(category);
    observeSections();
  } catch {
    setMessage("Não foi possível carregar a loja.", true);
  }
}

initializeStore();