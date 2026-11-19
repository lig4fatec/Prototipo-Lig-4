import { getCurrentUser } from "./services/auth.js";
import { CORES_VALIDAS } from "./services/rooms.js";
import { getProfile, getStats, updateProfile } from "./services/profile.js";
import { getEquipped } from "./services/store.js";
import { createAvatarImage } from "./player-style.js";

const colorNames = {
  blue: "Azul",
  red: "Vermelho",
  purple: "Roxo",
  green: "Verde",
  orange: "Laranja",
  yellow: "Amarelo",
  brown: "Marrom",
};

const form = document.querySelector("[data-profile-form]");
const formLayout = document.querySelector(".profile-layout");
const saveButton = form.querySelector('[type="submit"]');
const statusElement = form.querySelector("[data-profile-status]");
const tabButtons = [...document.querySelectorAll("[data-profile-tab]")];
const panels = [...document.querySelectorAll("[data-profile-panel]")];
let savedProfile = null;

function setFieldError(fieldName, message) {
  const field = form.querySelector(`[data-profile-field="${fieldName}"]`)
    || form.querySelector(`[name="${fieldName}"]`);
  const error = form.querySelector(`[data-profile-error="${fieldName}"]`);
  if (field) field.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
}

function readForm() {
  return {
    nick: form.elements.nick.value,
    name: form.elements.name.value,
    bio: form.elements.bio.value,
    color: form.elements.color.value,
  };
}

function updatePreview(profile) {
  document.querySelector("[data-profile-preview-nick]").textContent = profile.nick || "—";
  document.querySelector("[data-profile-preview-name]").textContent = profile.name || "";
  document.querySelector("[data-profile-preview-bio]").textContent = profile.bio || "";
  document.querySelector("[data-profile-preview-color]").textContent = colorNames[profile.color] || profile.color;
  document.querySelector("[data-profile-preview-swatch]").dataset.color = profile.color;
}

function updateDirtyState() {
  const current = readForm();
  const changed = Object.keys(current).some(key => current[key] !== savedProfile[key]);
  saveButton.disabled = !changed;
  updatePreview(current);
}

function renderColorChoices(selectedColor) {
  const container = form.querySelector("[data-profile-colors]");
  container.replaceChildren(...CORES_VALIDAS.map(color => {
    const label = document.createElement("label");
    label.className = "color-picker__option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "color";
    input.value = color;
    input.checked = color === selectedColor;
    input.setAttribute("aria-label", `Cor ${colorNames[color]}`);

    const swatch = document.createElement("span");
    swatch.className = "color-picker__swatch";
    swatch.dataset.color = color;
    swatch.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = colorNames[color];

    label.append(input, swatch, text);
    return label;
  }));
}

function setActiveProfilePanel(panelName) {
  formLayout.dataset.activePanel = panelName;
  for (const button of tabButtons) {
    const selected = button.dataset.profileTab === panelName;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
  syncMobilePanels();
}

function syncMobilePanels() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const activePanel = formLayout.dataset.activePanel;
  for (const panel of panels) {
    panel.hidden = isMobile && panel.dataset.profilePanel !== activePanel;
  }
}

for (const button of tabButtons) {
  button.addEventListener("click", () => setActiveProfilePanel(button.dataset.profileTab));
  button.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = tabButtons.indexOf(button);
    const nextIndex = event.key === "ArrowRight"
      ? (index + 1) % tabButtons.length
      : (index - 1 + tabButtons.length) % tabButtons.length;
    tabButtons[nextIndex].focus();
    tabButtons[nextIndex].click();
  });
}

form.addEventListener("input", () => {
  statusElement.textContent = "";
  updateDirtyState();
});
form.addEventListener("change", updateDirtyState);

form.addEventListener("submit", async event => {
  event.preventDefault();
  statusElement.textContent = "";
  setFieldError("nick", "");
  setFieldError("color", "");
  saveButton.disabled = true;

  try {
    savedProfile = await updateProfile(readForm());
    for (const [key, value] of Object.entries(savedProfile)) {
      if (key !== "color") form.elements[key].value = value;
    }
    updatePreview(savedProfile);
    statusElement.textContent = "Perfil salvo.";
  } catch (error) {
    if (error.code === "NICK_INVALIDO") {
      setFieldError("nick", "O nick é obrigatório e deve ter até 20 caracteres.");
      form.elements.nick.focus();
    } else if (error.code === "COR_INVALIDA") {
      setFieldError("color", "Selecione uma cor válida.");
    } else {
      statusElement.textContent = "Não foi possível salvar o perfil.";
    }
    saveButton.disabled = false;
  }
});

window.addEventListener("resize", syncMobilePanels);

async function showEquippedAvatar() {
  try {
    const { avatar } = await getEquipped();
    document.querySelector(".profile-avatar").replaceChildren(createAvatarImage(avatar, "profile-avatar__image"));
  } catch {
    // Mantém o ícone padrão se o avatar equipado não puder ser carregado.
  }
}

async function initializeProfile() {
  try {
    const [profile, stats, user] = await Promise.all([getProfile(), getStats(), getCurrentUser()]);
    savedProfile = profile;
    form.elements.nick.value = profile.nick;
    form.elements.name.value = profile.name;
    form.elements.bio.value = profile.bio;
    renderColorChoices(profile.color);
    document.querySelector("[data-profile-email]").textContent = user?.email || "Não autenticado";
    document.querySelector("[data-profile-wins]").textContent = stats.wins;
    document.querySelector("[data-profile-losses]").textContent = stats.losses;
    updatePreview(profile);
    updateDirtyState();
    syncMobilePanels();
    showEquippedAvatar();
  } catch {
    statusElement.textContent = "Não foi possível carregar o perfil.";
  }
}

initializeProfile();