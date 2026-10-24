import { createRoom } from "../services/rooms.js";
import { getRoomErrorMessage, renderColorPicker, saveRoomSession } from "../room-ui.js";

export function iniciarSecaoCriar(mostrarSecao) {
  const form = document.querySelector("[data-create-room-form]");
  const colorError = form.querySelector('[data-room-error="color"]');
  const seriesError = form.querySelector('[data-room-error="series"]');
  const status = form.querySelector("[data-room-status]");
  const submitButton = form.querySelector('[type="submit"]');
  let selectedColor = "blue";

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
      const { pin } = await createRoom({ series, color: selectedColor });
      saveRoomSession(pin, "owner");
      await mostrarSecao("lobby");
    } catch (error) {
      const message = getRoomErrorMessage(error.code);
      if (error.code === "SERIE_INVALIDA") seriesError.textContent = message;
      else if (error.code === "COR_INVALIDA") colorError.textContent = message;
      else status.textContent = message;
      submitButton.disabled = false;
    }
  });
}