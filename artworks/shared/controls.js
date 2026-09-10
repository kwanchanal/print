export function dropdown(label, choices, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "sheet-select";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sheet-select-button";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  button.textContent = choices.find(item => item.value === value)?.label || value;
  const list = document.createElement("ul");
  list.className = "sheet-options";
  list.role = "listbox";
  list.setAttribute("aria-label", label);
  const close = () => { button.setAttribute("aria-expanded", "false"); list.dataset.open = "false"; };
  for (const choice of choices) {
    const item = document.createElement("li");
    item.role = "option";
    item.tabIndex = -1;
    item.textContent = choice.label;
    item.setAttribute("aria-selected", String(choice.value === value));
    const choose = () => {
      button.textContent = choice.label;
      for (const other of list.children) other.setAttribute("aria-selected", String(other === item));
      close(); button.focus(); onChange(choice.value);
    };
    item.addEventListener("click", choose);
    item.addEventListener("keydown", event => {
      if (["Enter", " "].includes(event.key)) { event.preventDefault(); choose(); }
    });
    list.append(item);
  }
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open)); list.dataset.open = String(open);
  });
  wrapper.addEventListener("focusout", event => { if (!wrapper.contains(event.relatedTarget)) close(); });
  wrapper.addEventListener("keydown", event => {
    if (event.key === "Escape") { close(); button.focus(); }
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      button.setAttribute("aria-expanded", "true"); list.dataset.open = "true";
      const items = [...list.children];
      const index = items.indexOf(document.activeElement);
      items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    }
  });
  wrapper.append(button, list);
  return wrapper;
}

export function section(name) {
  const root = document.createElement("details");
  root.className = "collection-section control-group";
  const summary = document.createElement("summary");
  summary.textContent = name;
  const body = document.createElement("div");
  body.className = "collection-fields";
  root.append(summary, body);
  return { root, summary, body };
}
