import { alterarEmail, alterarSenha } from "./services/profile.js";
import { getRoomErrorMessage } from "./room-ui.js";

const mensagens = {
  EMAIL_INVALIDO: "Informe um e-mail válido.",
  CREDENCIAIS_INVALIDAS: "Senha incorreta.",
  EMAIL_JA_CADASTRADO: "Este e-mail já está em uso.",
  SENHA_INVALIDA: "A nova senha deve ter de 6 a 72 caracteres.",
};

function setStatus(form, texto, erro = false) {
  const status = form.querySelector("[data-security-status]");
  status.textContent = texto;
  status.dataset.state = erro ? "error" : "success";
}

document.querySelector('[data-security-form="email"]').addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const { email, senha } = Object.fromEntries(new FormData(form));
  setStatus(form, "Alterando...");
  try {
    await alterarEmail(email.trim(), senha);
    form.reset();
    setStatus(form, "E-mail alterado. Faça login novamente com o novo e-mail.");
  } catch (error) {
    setStatus(form, mensagens[error.code] || getRoomErrorMessage(error.code), true);
  }
});

document.querySelector('[data-security-form="senha"]').addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const { senhaAtual, senhaNova } = Object.fromEntries(new FormData(form));
  setStatus(form, "Alterando...");
  try {
    await alterarSenha(senhaAtual, senhaNova);
    form.reset();
    setStatus(form, "Senha alterada com sucesso.");
  } catch (error) {
    setStatus(form, mensagens[error.code] || getRoomErrorMessage(error.code), true);
  }
});