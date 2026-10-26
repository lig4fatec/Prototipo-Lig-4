/**
 * Substitui apenas a apresentação de um <select> por um menu personalizado.
 * O select original permanece no formulário e recebe eventos "change".
 * Uso: enhanceSelect(selectElement).
 */
let nextSelectId = 0;
export function enhanceSelect(select) {
  if (!select || select.dataset.customSelectReady === "true") return;
  select.dataset.customSelectReady = "true";

  const wrapper = document.createElement("div");
  wrapper.className = "game-select";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "game-select__trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const list = document.createElement("div");
  list.className = "game-select__list";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  const listId = `game-select-list-${++nextSelectId}`;
  list.id = listId;
  trigger.setAttribute("aria-controls", listId);

  select.parentNode.insertBefore(wrapper, select);
  wrapper.append(select, trigger, list);
  select.classList.add("game-select__native");
  select.tabIndex = -1;
  const label = select.id ? document.querySelector(`label[for="${CSS.escape(select.id)}"]`) : null;
  if (label) {
    const labelId = label.id || `${listId}-label`;
    label.id = labelId;
    trigger.setAttribute("aria-labelledby", labelId);
  } else {
    trigger.setAttribute("aria-label", select.dataset.selectLabel || "Selecionar opção");
  }

  let buttons = [];
  let activeIndex = 0;
  const close = (restoreFocus = false) => {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    wrapper.classList.remove("game-select--open");
    if (restoreFocus) trigger.focus();
  };
  const setActive = index => {
    activeIndex = Math.max(0, Math.min(buttons.length - 1, index));
    buttons.forEach((button, i) => {
      button.tabIndex = i === activeIndex ? 0 : -1;
      button.classList.toggle("game-select__option--active", i === activeIndex);
    });
    buttons[activeIndex]?.focus();
  };
  const choose = index => {
    const option = select.options[index];
    if (!option || option.disabled) return;
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    refresh();
    close(true);
  };
  const open = () => {
    refresh();
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    wrapper.classList.add("game-select--open");
    setActive(Math.max(0, select.selectedIndex));
  };
  function refresh() {
    trigger.textContent = select.selectedOptions[0]?.textContent || "Selecionar";
    list.replaceChildren();
    buttons = Array.from(select.options, (option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "game-select__option";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(option.selected));
      button.textContent = option.textContent;
      button.disabled = option.disabled;
      button.tabIndex = -1;
      button.addEventListener("click", () => choose(index));
      list.append(button);
      return button;
    });
  }
  trigger.addEventListener("click", () => {
    if (list.hidden) open();
    else close();
  });
  trigger.addEventListener("keydown", event => {
    if (["ArrowDown", "ArrowUp", "Home", "End", " "].includes(event.key)) {
      event.preventDefault();
      open();
      if (event.key === "End") setActive(buttons.length - 1);
      if (event.key === "ArrowUp") setActive(Math.max(0, activeIndex - 1));
    }
  });
  list.addEventListener("keydown", event => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") setActive(0);
      else if (event.key === "End") setActive(buttons.length - 1);
      else setActive(activeIndex + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") close();
  });
  select.addEventListener("change", refresh);
  document.addEventListener("pointerdown", event => {
    if (!wrapper.contains(event.target)) close();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !list.hidden) close(true);
  });
  refresh();
}
