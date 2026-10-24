import { login, register, logout } from "./services/auth.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authErrorMessages = {
  EMAIL_JA_CADASTRADO: "Este e-mail já está cadastrado.",
  CREDENCIAIS_INVALIDAS: "E-mail ou senha incorretos.",
  ARMAZENAMENTO_INDISPONIVEL: "Não foi possível acessar os dados locais. Tente novamente.",
  DADOS_DE_AUTENTICACAO_INVALIDOS: "Os dados locais estão inválidos.",
};

function getField(form, name) {
  return form.querySelector(`[data-field="${name}"]`);
}

function setFieldError(form, name, message) {
  const field = getField(form, name);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (!field || !error) return;

  field.setAttribute("aria-invalid", String(Boolean(message)));
  error.textContent = message;
}

function validateField(form, name) {
  const field = getField(form, name);
  const value = field.value.trim();
  let message = "";

  if (name === "email") {
    if (!value) message = "Informe seu e-mail.";
    else if (!emailPattern.test(value)) message = "Informe um e-mail válido.";
  } else if (name === "password") {
    if (!field.value) message = "Informe sua senha.";
    else if (field.value.length < 6) message = "A senha deve ter pelo menos 6 caracteres.";
  } else if (name === "confirm-password") {
    if (!field.value) message = "Confirme sua senha.";
    else if (field.value !== getField(form, "password").value) message = "As senhas não coincidem.";
  }

  setFieldError(form, name, message);
  return !message;
}

function setStatus(form, message, state = "") {
  const status = form.querySelector("[data-auth-status]");
  status.textContent = message;
  status.dataset.state = state;
}

function showServiceError(form, error) {
  setStatus(form, "");
  if (error.code === "EMAIL_JA_CADASTRADO") {
    setFieldError(form, "email", authErrorMessages[error.code]);
    getField(form, "email").focus();
    return;
  }
  if (error.code === "EMAIL_INVALIDO") {
    setFieldError(form, "email", "Informe um e-mail válido.");
    getField(form, "email").focus();
    return;
  }
  if (error.code === "SENHA_INVALIDA") {
    setFieldError(form, "password", "A senha deve ter pelo menos 6 caracteres.");
    getField(form, "password").focus();
    return;
  }

  setStatus(form, authErrorMessages[error.code] ?? "Não foi possível concluir. Tente novamente.", "error");
}

function bindForm(form) {
  const type = form.dataset.authForm;
  const fieldNames = type === "register" ? ["email", "password", "confirm-password"] : ["email", "password"];

  for (const field of form.querySelectorAll("[data-field]")) {
    field.addEventListener("blur", () => {
      field.dataset.touched = "true";
      validateField(form, field.dataset.field);
    });
    field.addEventListener("input", () => {
      setStatus(form, "");
      if (field.dataset.touched === "true") validateField(form, field.dataset.field);
      if (field.dataset.field === "password") {
        const confirmation = getField(form, "confirm-password");
        if (confirmation?.dataset.touched === "true") validateField(form, "confirm-password");
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(form, "");

    const isValid = fieldNames.map((name) => validateField(form, name)).every(Boolean);
    if (!isValid) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    setStatus(form, type === "register" ? "Cadastrando..." : "Entrando...");

    try {
      const email = getField(form, "email").value.trim();
      const password = getField(form, "password").value;

      if (type === "register") {
        await register(email, password);
        await logout();
        setStatus(form, "Cadastro realizado com sucesso. Redirecionando para o login...", "success");
        setTimeout(() => {
          window.location.href = "./t02-login.html";
        }, 1200);
      } else {
        await login(email, password);
        setStatus(form, "Login realizado com sucesso.", "success");
        window.location.href = "./t04-home.html";
      }
    } catch (error) {
      showServiceError(form, error);
    } finally {
      submitButton.disabled = false;
    }
  });
}

for (const form of document.querySelectorAll("[data-auth-form]")) {
  bindForm(form);
}

for (const toggle of document.querySelectorAll("[data-password-toggle]")) {
  toggle.addEventListener("click", () => {
    const input = document.getElementById(toggle.getAttribute("aria-controls"));
    const isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    toggle.setAttribute("aria-pressed", String(!isVisible));
    toggle.setAttribute("aria-label", isVisible ? "Mostrar senha" : "Ocultar senha");
  });
}