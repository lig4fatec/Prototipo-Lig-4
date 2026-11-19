const noticeKey = "lig4-aviso";
const notice = sessionStorage.getItem(noticeKey);

if (notice) {
  const warning = document.querySelector("[data-room-warning]");
  if (warning) {
    warning.textContent = "Sua sala não está mais disponível. Crie ou entre em outra.";
    warning.hidden = false;
  }
  sessionStorage.removeItem(noticeKey);
}