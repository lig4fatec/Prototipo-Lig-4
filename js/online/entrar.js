import { joinRoom } from "../services/rooms.js";
import { getEquipped } from "../services/store.js";
import { getRoomErrorMessage, saveRoomSession } from "../room-ui.js";

export function iniciarSecaoEntrar(mostrarSecao) {
  const form = document.querySelector("[data-join-room-form]");
  const pinInput = form.querySelector("[data-room-pin]");
  const pinError = form.querySelector('[data-room-error="pin"]');
  const status = form.querySelector("[data-room-status]");
  const submitButton = form.querySelector('[type="submit"]');

  pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6);
    pinError.textContent = "";
    pinInput.setAttribute("aria-invalid", "false");
  });
  pinInput.addEventListener("blur", () => {
    const invalid = !/^\d{6}$/.test(pinInput.value);
    pinInput.setAttribute("aria-invalid", String(invalid));
    pinError.textContent = invalid ? getRoomErrorMessage("PIN_INVALIDO") : "";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    pinError.textContent = "";
    status.textContent = "";
    submitButton.disabled = true;
    try {
      const { avatar } = await getEquipped();
      const { pin, role } = await joinRoom({ pin: pinInput.value, avatar });
      saveRoomSession(pin, role);
      await mostrarSecao("lobby");
    } catch (error) {
      const message = getRoomErrorMessage(error.code);
      if (["PIN_INVALIDO", "PIN_NAO_ENCONTRADO", "SALA_CHEIA"].includes(error.code)) {
        pinError.textContent = message;
        pinInput.setAttribute("aria-invalid", "true");
        pinInput.focus();
      } else {
        status.textContent = message;
      }
      submitButton.disabled = false;
    }
  });
}
