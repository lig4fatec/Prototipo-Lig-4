import { enhanceSelect } from "../ui/custom-select.js";
import { GAME_MODES } from "../game/modes.js";
import { createRoom } from "../services/rooms.js";
import { getEquipped } from "../services/store.js";
import { getRoomErrorMessage, saveRoomSession } from "../room-ui.js";

export function iniciarSecaoCriar(mostrarSecao) {
  const form = document.querySelector("[data-create-room-form]");
  const status = form.querySelector("[data-room-status]");
  const submitButton = form.querySelector('[type="submit"]');
  const modeSelect = form.elements.mode;

  modeSelect.replaceChildren(...GAME_MODES.map(mode => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.name;
    return option;
  }));
  enhanceSelect(modeSelect);

  const modeHelp = form.querySelector("[data-room-mode-help]");
  const updateModeHelp = () => {
    modeHelp.textContent = modeSelect.value === "caos"
      ? "MODO CAOS: LIG-4 de uma perspectiva competitiva e inovadora: use poderes especiais para mudar as regras do jogo e tentar garantir a vitória."
      : "MODO CLÁSSICO: LIG-4 do jeito que você conhece. Forme 4 peças em sequência para ganhar.";
  };
  modeSelect.addEventListener("change", updateModeHelp);
  updateModeHelp();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    submitButton.disabled = true;
    try {
      const { avatar } = await getEquipped();
      const { pin } = await createRoom({ mode: modeSelect.value, avatar });
      saveRoomSession(pin, "owner");
      await mostrarSecao("lobby");
    } catch (error) {
      status.textContent = error.code === "MODO_INVALIDO"
        ? "Selecione um modo válido."
        : getRoomErrorMessage(error.code);
      submitButton.disabled = false;
    }
  });
}
