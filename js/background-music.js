const musicFile = document.body.dataset.backgroundMusic;

if (musicFile) {
  const musicSource = new URL(`../html/audio/${musicFile}`, import.meta.url);
  const music = new Audio(musicSource.href);
  music.volume = 0.3;
  music.preload = "auto";
  const positionKey = `lig4-background-music:${musicFile}`;
  let storageAvailable = true;
  let ready = false;

  const reportStorageError = (error) => {
    storageAvailable = false;
    console.warn("Não foi possível preservar a posição da música entre páginas.", error);
  };

  const savePosition = (position = music.currentTime) => {
    if (!storageAvailable) return;

    try {
      sessionStorage.setItem(positionKey, String(position));
    } catch (error) {
      reportStorageError(error);
    }
  };

  const loadPosition = () => {
    try {
      const position = Number(sessionStorage.getItem(positionKey));
      return Number.isFinite(position) && position > 0 ? position : 0;
    } catch (error) {
      reportStorageError(error);
      return 0;
    }
  };

  const startMusic = () => {
    if (!ready || !music.paused) return;

    const playPromise = music.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        if (error.name !== "NotAllowedError") {
          console.warn("Não foi possível reproduzir a música de fundo.", error);
        }
      });
    }
  };

  music.addEventListener("loadedmetadata", () => {
    const savedPosition = loadPosition();
    if (savedPosition > 0 && savedPosition < music.duration) {
      music.currentTime = savedPosition;
    } else if (savedPosition > 0) {
      savePosition(0);
    }
    ready = true;
    startMusic();
  }, { once: true });

  music.addEventListener("timeupdate", () => savePosition());
  music.addEventListener("ended", () => {
    music.currentTime = 0;
    savePosition(0);
    startMusic();
  });
  music.addEventListener("error", () => {
    console.warn(`Não foi possível carregar a música "${musicFile}".`, music.error);
  });

  document.addEventListener("pointerdown", startMusic);
  document.addEventListener("keydown", startMusic);
  window.addEventListener("pagehide", () => {
    savePosition();
    music.pause();
  });
  window.addEventListener("pageshow", startMusic);
  startMusic();
}
