// Demonstração visual: não processa pagamentos nem modifica o saldo.
export function initializeCoinShop({ getBalance }) {
  const dialog = document.querySelector("[data-store-coins-dialog]");
  const opener = document.querySelector("[data-store-add-coins]");
  const balance = document.querySelector("[data-store-coins-balance]");
  const selection = document.querySelector("[data-store-coins-selection]");
  const options = [...document.querySelectorAll("[data-store-coin-package]")];
  const formatter = new Intl.NumberFormat("pt-BR");
  opener.addEventListener("click", async () => {
    options.forEach(button => button.setAttribute("aria-pressed", "false"));
    selection.textContent = "Nenhum pacote selecionado.";
    balance.textContent = "--";
    dialog.showModal();
    try { const result = await getBalance(); if (dialog.open) balance.textContent = formatter.format(result.coins); }
    catch { if (dialog.open) balance.textContent = "Indisponível"; }
  });
  options.forEach(button => button.addEventListener("click", () => {
    options.forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    selection.textContent = `Pacote selecionado: ${formatter.format(Number(button.dataset.storeCoinPackage))} moedas. Compra indisponível nesta demonstração.`;
  }));
  document.querySelector("[data-store-coins-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener.focus());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
}
