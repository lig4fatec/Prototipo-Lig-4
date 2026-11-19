import { logout } from "./services/auth.js";

for (const button of document.querySelectorAll("[data-global-logout]")) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await logout();
      window.location.assign("./t01-boas-vindas.html");
    } catch {
      button.disabled = false;
    }
  });
}