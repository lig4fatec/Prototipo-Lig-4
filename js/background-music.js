const musicFile = document.body.dataset.backgroundMusic;

if (musicFile) {
  const settingsKey = "lig4-background-music-settings";
  const settings = { volume: 0.3, muted: false, hidden: false };
  let settingsStorageAvailable = true;

  try {
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      if (
        typeof parsedSettings.volume === "number" &&
        Number.isFinite(parsedSettings.volume) &&
        parsedSettings.volume >= 0 &&
        parsedSettings.volume <= 1 &&
        typeof parsedSettings.muted === "boolean"
      ) {
        settings.volume = parsedSettings.volume;
        settings.muted = parsedSettings.muted;
        settings.hidden = parsedSettings.hidden === true;
      } else {
        console.warn("As preferências de música salvas são inválidas.");
      }
    }
  } catch (error) {
    settingsStorageAvailable = false;
    console.warn("Não foi possível carregar as preferências de música.", error);
  }

  const saveSettings = () => {
    if (!settingsStorageAvailable) return;

    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch (error) {
      settingsStorageAvailable = false;
      console.warn("Não foi possível salvar as preferências de música.", error);
    }
  };

  const musicSource = new URL(`../html/audio/${musicFile}`, import.meta.url);
  const music = new Audio(musicSource.href);
  music.volume = settings.volume;
  music.muted = settings.muted;
  music.preload = "auto";
  const positionKey = `lig4-background-music:${musicFile}`;
  let storageAvailable = true;
  let ready = false;

  const musicControl = document.createElement("section");
  musicControl.className = "music-control";
  musicControl.setAttribute("aria-label", "Controle da música");

  const controlLauncher = document.createElement("button");
  controlLauncher.className = "music-control__launcher";
  controlLauncher.type = "button";
  controlLauncher.setAttribute("aria-expanded", "false");
  controlLauncher.setAttribute("aria-controls", "music-control-panel");
  controlLauncher.setAttribute("aria-label", "Mostrar controles da música");
  controlLauncher.title = "Controles da música";
  controlLauncher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Zm12-3a7 7 0 0 1 0 10m2-13a10 10 0 0 1 0 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const launcherLabel = document.createElement("span");
  launcherLabel.textContent = "Música";
  controlLauncher.append(launcherLabel);

  const controlPanel = document.createElement("div");
  controlPanel.className = "music-control__panel";
  controlPanel.id = "music-control-panel";
  controlPanel.hidden = true;

  const controlHeader = document.createElement("div");
  controlHeader.className = "music-control__header";
  const controlTitle = document.createElement("strong");
  controlTitle.className = "music-control__title";
  controlTitle.textContent = "Música";
  const volumeOutput = document.createElement("output");
  volumeOutput.className = "music-control__volume";
  volumeOutput.setAttribute("aria-live", "off");

  const closeButton = document.createElement("button");
  closeButton.className = "music-control__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Esconder controles da música");

  const hideControlButton = document.createElement("button");
  hideControlButton.className = "music-control__hide";
  hideControlButton.type = "button";
  hideControlButton.textContent = "Ocultar controle (Alt+M para reexibir)";

  const muteButton = document.createElement("button");
  muteButton.className = "music-control__toggle";
  muteButton.type = "button";
  muteButton.setAttribute("aria-pressed", String(music.muted));

  const volumeSlider = document.createElement("input");
  volumeSlider.className = "music-control__slider";
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "1";
  volumeSlider.step = "0.01";
  volumeSlider.value = String(music.volume);
  volumeSlider.setAttribute("aria-label", "Volume da música");

  const updateMusicControl = () => {
    muteButton.textContent = music.muted ? "Ativar música" : "Mutar música";
    muteButton.setAttribute("aria-pressed", String(music.muted));
    controlLauncher.setAttribute(
      "aria-label",
      music.muted ? "Mostrar controles da música, música mutada" : "Mostrar controles da música",
    );
    volumeSlider.value = String(music.volume);
    volumeOutput.textContent = `${Math.round(music.volume * 100)}%`;
  };

  const setControlPanelOpen = (open) => {
    controlPanel.hidden = !open;
    controlLauncher.setAttribute("aria-expanded", String(open));
  };

  const setControlHidden = (hidden) => {
    settings.hidden = hidden;
    musicControl.hidden = hidden;
    setControlPanelOpen(false);
    saveSettings();
  };

  controlLauncher.addEventListener("click", () => setControlPanelOpen(controlPanel.hidden));
  closeButton.addEventListener("click", () => {
    setControlPanelOpen(false);
    controlLauncher.focus();
  });
  hideControlButton.addEventListener("click", () => setControlHidden(true));
  muteButton.addEventListener("click", () => {
    music.muted = !music.muted;
    settings.muted = music.muted;
    saveSettings();
    updateMusicControl();
    if (!music.muted) startMusic();
  });
  volumeSlider.addEventListener("input", () => {
    music.volume = Number(volumeSlider.value);
    settings.volume = music.volume;
    updateMusicControl();
  });
  volumeSlider.addEventListener("change", saveSettings);

  controlHeader.append(controlTitle, volumeOutput, closeButton);
  controlPanel.append(controlHeader, muteButton, volumeSlider, hideControlButton);
  musicControl.append(controlLauncher, controlPanel);
  document.body.append(musicControl);
  musicControl.hidden = settings.hidden;
  updateMusicControl();

  document.addEventListener("keydown", (event) => {
    if (!event.altKey || event.key.toLowerCase() !== "m") return;
    event.preventDefault();
    setControlHidden(!settings.hidden);
  });

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
    if (!ready || music.muted || music.volume === 0 || !music.paused) return;

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
