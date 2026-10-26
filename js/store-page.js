import { enhanceSelect } from "./ui/custom-select.js";
import { initializeCoinShop } from "./coin-shop.js";
import { logout } from "./services/auth.js";
import {
  equipItem,
  getBalance,
  getCatalog,
  getEquipped,
  getItemImageUrl,
  purchaseItem,
} from "./services/store.js";

const tabButtons = [...document.querySelectorAll("[data-store-tab]")];
const sections = [...document.querySelectorAll("[data-store-section]")];
const balanceElement = document.querySelector("[data-store-balance]");
const messageElement = document.querySelector("[data-store-message]");
const numberFormat = new Intl.NumberFormat("pt-BR");
const TOAST_VISIBLE_MS = 3200;
let catalogData = null;
let searchText = "";
let filterMode = "all";
let sortMode = "default";
let previewCategory = null;
let previewItemId = null;
let lastPreviewTrigger = null;
const previewDialog = document.querySelector("[data-store-preview]");
const afterBuyDialog = document.querySelector("[data-store-after-buy]");
let equipped = {};
let coins = 0;
let toastElement = null;
let toastTimer = null;

function setMessage(message, isError = false, isSuccess = false) {
  messageElement.textContent = message;
  messageElement.dataset.state = isError ? "error" : isSuccess ? "success" : "";
}

// Aviso visual fixo na tela (a loja é longa e a mensagem do topo pode estar fora de vista).
// O anúncio para leitores de tela continua sendo feito pela mensagem do topo (role="status").
function showToast(message, state) {
  if (!toastElement) {
    toastElement = document.createElement("div");
    toastElement.className = "store-toast";
    toastElement.setAttribute("aria-hidden", "true");
    document.body.append(toastElement);
  }
  const icon = document.createElement("span");
  icon.className = "store-toast__icon";
  icon.textContent = state === "error" ? "!" : "✓";
  const text = document.createElement("span");
  text.textContent = message;
  toastElement.replaceChildren(icon, text);
  toastElement.dataset.state = state;
  toastElement.dataset.visible = "true";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastElement.dataset.visible = "false"; }, TOAST_VISIBLE_MS);
}

function setBalance(nextCoins, { highlight = false } = {}) {
  coins = nextCoins;
  balanceElement.textContent = numberFormat.format(nextCoins);
  if (!highlight) return;
  balanceElement.classList.remove("is-updated");
  void balanceElement.offsetWidth;
  balanceElement.classList.add("is-updated");
}

function flashCard(itemId, className) {
  const card = document.querySelector(`[data-item-id="${itemId}"]`);
  if (!card) return;
  card.classList.remove(className);
  void card.offsetWidth;
  card.classList.add(className);
  card.addEventListener("animationend", () => card.classList.remove(className), { once: true });
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

function makeArtImage(item) {
  const image = document.createElement("img");
  image.className = "store-card__art";
  image.src = getItemImageUrl(item);
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function makePreview(categoryId, item) {
  const name = item.name;
  const preview = document.createElement("div");
  preview.className = `store-card__preview store-card__preview--${categoryId}`;
  preview.setAttribute("aria-hidden", "true");

  if (item.image) {
    preview.append(makeArtImage(item));
  } else if (categoryId === "emote" && item.emoji) {
    const emoji = document.createElement("span");
    emoji.className = "store-card__emoji";
    emoji.textContent = item.emoji;
    preview.append(emoji);
  } else {
    const mark = document.createElement("span");
    mark.className = "store-card__mark";
    mark.textContent = categoryId === "emote" ? name.slice(0, 2).toUpperCase() : name.slice(0, 1).toUpperCase();
    preview.append(mark);
  }

  if (item.popular && !item.owned) {
    const badge = document.createElement("span");
    badge.className = "store-card__badge";
    badge.textContent = "Popular";
    preview.append(badge);
  }

  return preview;
}

function renderItem(category, item) {
  const listItem = document.createElement("li");
  listItem.className = "store-grid__item";
  listItem.dataset.itemId = item.id;

  const card = document.createElement("article");
  card.className = "ui-card store-card";
  const art = makePreview(category.id, item);
  art.classList.add("store-card__preview--clickable");
  art.setAttribute("aria-hidden", "false");
  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "store-card__preview-button";
  previewButton.setAttribute("aria-label", `Visualizar ${item.name}`);
  previewButton.append(art);
  previewButton.addEventListener("click", () => openPreview(category.id, item.id, previewButton));
  card.append(previewButton);

  const details = document.createElement("div");
  details.className = "store-card__details";

  const name = document.createElement("h3");
  name.className = "store-card__name";
  name.textContent = item.name;

  const meta = document.createElement("div");
  meta.className = "store-card__meta";

  const status = document.createElement("span");
  status.className = "ui-status";
  if (category.id !== "emote" && equipped[category.id] === item.id) {
    status.textContent = "Equipado";
    status.dataset.state = "equipped";
  } else if (item.owned) {
    status.textContent = item.price > 0 ? "Comprado" : "Incluído";
    status.dataset.state = "owned";
  } else if (coins >= item.price) {
    status.textContent = "Disponível";
    status.dataset.state = "available";
  } else {
    status.textContent = "Moedas insuficientes";
    status.dataset.state = "short";
  }
  meta.append(status);

  if (!item.owned) {
    const price = document.createElement("span");
    price.className = "store-card__price";
    if (coins < item.price) price.classList.add("store-card__price--short");
    price.append(makeCoinIcon(), document.createTextNode(numberFormat.format(item.price)));
    meta.append(price);
  } else if (item.price === 0) {
    const free = document.createElement("span");
    free.className = "store-card__price store-card__price--free";
    free.textContent = "Grátis";
    meta.append(free);
  }

  details.append(name);
  if (item.description) {
    const description = document.createElement("p");
    description.className = "store-card__description";
    description.textContent = item.description;
    description.title = item.description;
    details.append(description);
  }
  details.append(meta);

  if (!item.owned) {
    const affordable = coins >= item.price;
    const buyButton = document.createElement("button");
    buyButton.className = "button button-primary-light store-card__action";
    buyButton.type = "button";
    buyButton.textContent = "Comprar";
    buyButton.dataset.affordable = String(affordable);
    buyButton.setAttribute("aria-label", `Comprar ${item.name} por ${numberFormat.format(item.price)} moedas`);
    buyButton.addEventListener("click", () => buyItem(category, item, buyButton));
    details.append(buyButton);
  } else if (category.id !== "emote" && equipped[category.id] !== item.id) {
    const equipButton = document.createElement("button");
    equipButton.className = "button button-primary-dark store-card__action";
    equipButton.type = "button";
    equipButton.textContent = "Equipar";
    equipButton.addEventListener("click", async () => {
      equipButton.disabled = true;
      setMessage("");
      try {
        equipped = await equipItem({ category: category.id, itemId: item.id });
        renderCatalog(catalogData);
        setMessage(`${item.name} equipado.`);
        showToast(`${item.name} equipado.`, "success");
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

function updateSectionCount(category) {
  const heading = document.querySelector(`[data-store-section="${category.id}"] .store-section__heading`);
  if (!heading) return;
  let count = heading.querySelector(".store-section__count");
  if (!count) {
    count = document.createElement("span");
    count.className = "store-section__count";
    heading.append(count);
  }
  const owned = category.items.filter(item => item.owned).length;
  count.textContent = `${owned} de ${category.items.length} no inventário`;
}

function renderCategory(category) {
  const list = document.querySelector(`[data-store-items="${category.id}"]`);
  if (!list) return;
  const visible = filteredItems(category);
  list.replaceChildren(...visible.map(item => renderItem(category, item)));
  let empty = list.nextElementSibling;
  if (!empty?.classList.contains("store-empty")) {
    empty = document.createElement("p");
    empty.className = "store-empty";
    list.after(empty);
  }
  empty.hidden = visible.length !== 0;
  empty.textContent = "Nenhum produto corresponde à pesquisa ou aos filtros.";
  updateSectionCount(category);
}

function filteredItems(category) {
  const normalized = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalized(searchText.trim());
  const result = category.items.filter(item => {
    if (query && !normalized(`${item.name} ${item.description || ""}`).includes(query)) return false;
    if (filterMode === "owned" && !item.owned) return false;
    if (filterMode === "unowned" && item.owned) return false;
    if (filterMode === "affordable" && (item.owned || item.price > coins)) return false;
    return true;
  });
  if (sortMode === "name") result.sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));
  if (sortMode === "price-asc") result.sort((a,b) => a.price - b.price);
  if (sortMode === "price-desc") result.sort((a,b) => b.price - a.price);
  return result;
}

function renderCatalog(catalog) {
  if (!catalog) return;
  catalogData = catalog;
  for (const category of catalog.categories) renderCategory(category);
}

function previewList() {
  return filteredItems(catalogData.categories.find(category => category.id === previewCategory));
}
function showPreviewItem() {
  const items = previewList();
  const index = items.findIndex(item => item.id === previewItemId);
  if (index < 0) { previewDialog.close(); return; }
  const item = items[index];
  document.querySelector("[data-preview-name]").textContent = item.name;
  document.querySelector("[data-preview-description]").textContent = item.description || "";
  document.querySelector("[data-preview-status]").textContent = item.owned ? (previewCategory !== "emote" && equipped[previewCategory] === item.id ? "Equipado" : "Adquirido") : `${numberFormat.format(item.price)} moedas`;
  document.querySelector("[data-preview-counter]").textContent = `${index + 1} de ${items.length}`;
  const art = document.querySelector("[data-preview-art]");
  art.replaceChildren(makePreview(previewCategory, item));
  document.querySelector("[data-preview-prev]").disabled = items.length < 2;
  document.querySelector("[data-preview-next]").disabled = items.length < 2;
}
function openPreview(categoryId, itemId, trigger) {
  previewCategory = categoryId;
  previewItemId = itemId;
  lastPreviewTrigger = trigger;
  showPreviewItem();
  previewDialog.showModal();
}
function stepPreview(delta) {
  const items = previewList();
  if (items.length < 2) return;
  const index = items.findIndex(item => item.id === previewItemId);
  previewItemId = items[(index + delta + items.length) % items.length].id;
  showPreviewItem();
}
document.querySelector("[data-preview-prev]").addEventListener("click", () => stepPreview(-1));
document.querySelector("[data-preview-next]").addEventListener("click", () => stepPreview(1));
document.querySelector("[data-preview-close]").addEventListener("click", () => previewDialog.close());
previewDialog.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault(); stepPreview(event.key === "ArrowLeft" ? -1 : 1);
  }
});
previewDialog.addEventListener("close", () => { if (lastPreviewTrigger?.isConnected) lastPreviewTrigger.focus(); });
for (const [selector, setter] of [
  ["[data-store-search]", value => { searchText = value; }],
  ["[data-store-filter]", value => { filterMode = value; }],
  ["[data-store-sort]", value => { sortMode = value; }],
]) {
  const input = document.querySelector(selector);
  input.addEventListener(selector.includes("search") ? "input" : "change", () => {
    setter(input.value);
    renderCatalog(catalogData);
  });
}

async function offerEquip(category, item) {
  document.querySelector("[data-after-buy-text]").textContent = `${item.name} foi adicionado ao seu inventário. Deseja equipá-lo agora?`;
  afterBuyDialog.showModal();
  return new Promise(resolve => {
    const later = document.querySelector("[data-after-buy-later]");
    const now = document.querySelector("[data-after-buy-equip]");
    const finish = value => { afterBuyDialog.close(); resolve(value); };
    const controller = new AbortController();
    later.addEventListener("click", () => finish(false), { once: true, signal: controller.signal });
    now.addEventListener("click", () => finish(true), { once: true, signal: controller.signal });
    afterBuyDialog.addEventListener("close", () => { controller.abort(); resolve(false); }, { once: true, signal: controller.signal });
  });
}

const purchaseErrorMessages = {
  ITEM_JA_POSSUIDO: item => `Você já possui ${item.name}.`,
  ITEM_INEXISTENTE: () => "Este item não está mais disponível na loja.",
};

async function buyItem(category, item, button) {
  button.disabled = true;
  setMessage("");
  try {
    const result = await purchaseItem({ category: category.id, itemId: item.id });
    setBalance(result.balance.coins, { highlight: true });
    equipped = result.equipped;
    renderCatalog(await getCatalog());
    flashCard(item.id, "store-card--purchased");
    const message = `${item.name} comprado por ${numberFormat.format(item.price)} moedas. Saldo: ${numberFormat.format(result.balance.coins)}.`;
    setMessage(message, false, true);
    showToast(`${item.name} adicionado ao inventário!`, "success");
    if (category.id !== "emote" && await offerEquip(category, item)) {
      try {
        equipped = await equipItem({ category: category.id, itemId: item.id });
        renderCatalog(await getCatalog());
        setMessage(`${item.name} equipado.`, false, true);
        showToast(`${item.name} equipado!`, "success");
      } catch (error) {
        const message = error.code === "ITEM_NAO_POSSUIDO" ? "O item não está no inventário." : "Não foi possível equipar o item.";
        setMessage(message, true); showToast(message, "error");
      }
    }
    document.querySelector(`[data-item-id="${item.id}"] button`)?.focus({ preventScroll: true });
  } catch (error) {
    let message;
    if (error.code === "SALDO_INSUFICIENTE") {
      message = `Saldo insuficiente para ${item.name}: faltam ${numberFormat.format(error.missing)} moedas.`;
    } else {
      message = purchaseErrorMessages[error.code]?.(item) ?? "Não foi possível concluir a compra. Tente novamente.";
    }
    setMessage(message, true);
    showToast(message, "error");
    if (error.code === "ITEM_JA_POSSUIDO") {
      // O inventário mudou em outra aba/sessão: atualiza a tela com o estado real.
      const [freshCatalog, balance] = await Promise.all([getCatalog(), getBalance()]);
      setBalance(balance.coins);
      renderCatalog(freshCatalog);
    } else {
      button.disabled = false;
      flashCard(item.id, "store-card--refused");
    }
  }
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
    setBalance(balance.coins);
    renderCatalog(catalog);
    observeSections();
  } catch {
    setMessage("Não foi possível carregar a loja.", true);
  }
}

initializeCoinShop({ getBalance });
initializeStore();
for (const select of document.querySelectorAll("[data-store-filter], [data-store-sort]")) enhanceSelect(select);
