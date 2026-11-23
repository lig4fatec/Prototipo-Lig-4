import { playSound } from "./sound-effects.js";

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const control = event.target.closest(
    'a[href], button, input[type="button"], input[type="submit"], input[type="reset"], input[type="image"], [role="button"], .button, .store-wallet',
  );
  if (!control || control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") return;

  const playPromise = playSound("click.mp3", "o som de clique");
  if (control.matches("[data-store-add-coins], .store-wallet")) {
    playSound("somMoedas.mp3", "o som das moedas");
  }

  if (
    !(control instanceof HTMLAnchorElement) ||
    control.hasAttribute("download") ||
    (control.target && control.target !== "_self") ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const href = control.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

  event.preventDefault();
  let navigated = false;
  const navigate = () => {
    if (navigated) return;
    navigated = true;
    window.location.assign(control.href);
  };

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(navigate);
  }
  window.setTimeout(navigate, 250);
});
