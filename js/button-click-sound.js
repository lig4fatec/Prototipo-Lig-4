const clickSoundSource = new URL("../html/audio/click.mp3", import.meta.url);
const clickSound = new Audio(clickSoundSource.href);
clickSound.preload = "auto";

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const control = event.target.closest(
    'a[href], button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], .button, .store-wallet',
  );
  if (!control || control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") return;

  const isWalletClick = Boolean(control.closest(".store-wallet"));
  const playback = isWalletClick
    ? new Audio(new URL("../html/audio/somMoedas.mp3", import.meta.url).href)
    : clickSound.cloneNode();
  playback.volume = 1;
  const playPromise = playback.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn(
        isWalletClick
          ? "Não foi possível reproduzir o som das moedas."
          : "Não foi possível reproduzir o som de clique.",
        error,
      );
    });
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
