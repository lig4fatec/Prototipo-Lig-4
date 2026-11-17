import { addDemoCoins } from "./services/store.js";

export function initializeCoinShop({ getBalance, onBalanceChange }) {
  const dialog = document.querySelector("[data-store-coins-dialog]");
  const opener = document.querySelector("[data-store-add-coins]");
  const balance = document.querySelector("[data-store-coins-balance]");
  const selection = document.querySelector("[data-store-coins-selection]");
  const options = [...document.querySelectorAll("[data-store-coin-package]")];
  const buyButton = document.querySelector("[data-store-coins-buy]");
  const formatter = new Intl.NumberFormat("pt-BR");
  let selectedAmount = null;

  opener.addEventListener("click", async () => {
    selectedAmount = null;
    options.forEach(button => button.setAttribute("aria-pressed", "false"));
    buyButton.disabled = true;
    selection.textContent = "Nenhum pacote selecionado.";
    balance.textContent = "--";
    dialog.showModal();
    try { const result = await getBalance(); if (dialog.open) balance.textContent = formatter.format(result.coins); }
    catch { if (dialog.open) balance.textContent = "Indisponível"; }
  });
  options.forEach(button => button.addEventListener("click", () => {
    selectedAmount = Number(button.dataset.storeCoinPackage);
    options.forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    selection.textContent = `Pacote selecionado: ${formatter.format(selectedAmount)} moedas.`;
    buyButton.disabled = false;
  }));
  buyButton.addEventListener("click", async () => {
    if (!selectedAmount) return;
    buyButton.disabled = true;
    try {
      const result = await addDemoCoins(selectedAmount);
      balance.textContent = formatter.format(result.coins);
      selection.textContent = `${formatter.format(selectedAmount)} moedas adicionadas ao saldo demonstrativo.`;
      onBalanceChange?.(result.coins);
      selectedAmount = null;
      options.forEach(button => button.setAttribute("aria-pressed", "false"));
    } catch {
      selection.textContent = "Não foi possível adicionar as moedas.";
    } finally {
      buyButton.disabled = true;
    }
  });
  document.querySelector("[data-store-coins-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener.focus());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
}
