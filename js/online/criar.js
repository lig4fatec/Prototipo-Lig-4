import { enhanceSelect } from "../ui/custom-select.js";
import { GAME_MODES } from "../game/modes.js";
import { createRoom } from "../services/rooms.js";
import { getEquipped } from "../services/store.js";
import { getRoomErrorMessage, renderColorPicker, saveRoomSession } from "../room-ui.js";

export function iniciarSecaoCriar(mostrarSecao) {
  const form = document.querySelector("[data-create-room-form]");
  const colorError = form.querySelector('[data-room-error="color"]');
  const seriesError = form.querySelector('[data-room-error="series"]');
  const status = form.querySelector("[data-room-status]");
  const submitButton = form.querySelector('[type="submit"]');
  let selectedColor = "blue";
  const modeSelect = form.elements.mode;
  modeSelect.replaceChildren(...GAME_MODES.map(mode => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.name;
    return option;
  }));

  enhanceSelect(modeSelect);

  renderColorPicker(form.querySelector("[data-room-colors]"), "series-room-color", selectedColor, color => {
    selectedColor = color;
    colorError.textContent = "";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    colorError.textContent = "";
    seriesError.textContent = "";
    status.textContent = "";
    submitButton.disabled = true;

    try {
      const series = Number(form.elements.series.value);
      const { avatar } = await getEquipped();
      const { pin } = await createRoom({ series, mode: modeSelect.value, color: selectedColor, avatar });
      saveRoomSession(pin, "owner");
      await mostrarSecao("lobby");
    } catch (error) {
      const message = getRoomErrorMessage(error.code);
      if (error.code === "MODO_INVALIDO") status.textContent = "Selecione um modo válido.";
      else if (error.code === "SERIE_INVALIDA") seriesError.textContent = message;
      else if (error.code === "COR_INVALIDA") colorError.textContent = message;
      else status.textContent = message;
      submitButton.disabled = false;
    }
  });
}