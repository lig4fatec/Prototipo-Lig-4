export function playSound(fileName, description = fileName) {
  const source = new URL(`../html/audio/${fileName}`, import.meta.url);
  const playback = new Audio(source.href);
  playback.volume = 1;

  const playPromise = playback.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn(`Não foi possível reproduzir ${description}.`, error);
    });
  }

  return playPromise;
}
