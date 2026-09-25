import "./style.css";

const menuButton = document.querySelector('[data-testid="menu-button"]');
const navigation = document.querySelector("#main-navigation");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}
menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
  navigation.classList.toggle("is-open", isOpen);
});
navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia("(min-width: 768px)").addEventListener("change", closeMenu);

const billingToggle = document.querySelector('[data-testid="billing-toggle"]');
billingToggle.addEventListener("click", () => {
  const yearly = billingToggle.getAttribute("aria-checked") !== "true";
  billingToggle.setAttribute("aria-checked", String(yearly));
  for (const [plan, monthlyPrice] of Object.entries({
    free: 0,
    family: 4,
    plus: 9,
  })) {
    document.querySelector(`[data-testid="price-${plan}"]`).textContent =
      `$${monthlyPrice * (yearly ? 10 : 1)}/${yearly ? "yr" : "mo"}`;
    const detail = document.querySelector(`[data-billing-detail="${plan}"]`);
    if (detail)
      detail.textContent = yearly
        ? "Billed yearly. Two months on us."
        : "Billed monthly. Cancel any time.";
  }
});

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(expanded));
    document.getElementById(button.getAttribute("aria-controls")).hidden =
      !expanded;
  });
});

const dialog = document.querySelector("#list-dialog");
document
  .querySelectorAll("[data-open-demo]")
  .forEach((button) =>
    button.addEventListener("click", () => dialog.showModal()),
  );
document
  .querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.close();
  }
});

const defaultItems = () => [
  { name: "Avocados", done: false },
  { name: "Sourdough bread", done: false },
  { name: "Oat milk", done: true },
];
let items = defaultItems();
try {
  const saved = JSON.parse(localStorage.getItem("tidepool-preview"));
  if (
    Array.isArray(saved) &&
    saved.length <= 100 &&
    saved.every(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.length <= 80 &&
        typeof item.done === "boolean",
    )
  )
    items = saved;
} catch {
  /* The preview also works when browser storage is unavailable. */
}
const demoList = document.querySelector("#demo-list");
const listStatus = document.querySelector("#list-status");
function saveList() {
  try {
    localStorage.setItem("tidepool-preview", JSON.stringify(items));
  } catch {
    /* Keep the current list in memory. */
  }
}
function renderList() {
  demoList.replaceChildren();
  items.forEach((item, index) => {
    const row = document.createElement("li");
    const label = document.createElement("label");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = item.done;
    const name = document.createElement("span");
    name.textContent = item.name;
    check.addEventListener("change", () => {
      items[index].done = check.checked;
      saveList();
      updateCount();
    });
    label.append(check, name);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.setAttribute("aria-label", `Remove ${item.name}`);
    remove.innerHTML =
      '<svg class="icon" aria-hidden="true"><use href="#icon-close"/></svg>';
    remove.addEventListener("click", () => {
      items.splice(index, 1);
      saveList();
      renderList();
      const nextButton =
        demoList.querySelectorAll(".remove-item")[
          Math.min(index, items.length - 1)
        ];
      (nextButton || document.querySelector("#new-item")).focus();
    });
    row.append(label, remove);
    demoList.append(row);
  });
  updateCount();
}
function updateCount() {
  const remaining = items.filter((item) => !item.done).length;
  listStatus.textContent = items.length
    ? `${remaining} ${remaining === 1 ? "thing" : "things"} left to pick up. You've got this.`
    : "A fresh start. Add your first item above.";
}
document.querySelector("#add-item-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#new-item");
  const name = input.value.trim();
  if (!name) {
    input.value = "";
    input.focus();
    return;
  }
  if (items.length >= 100) {
    listStatus.textContent =
      "This preview holds up to 100 items. Remove an item to add another.";
    return;
  }
  items.push({ name, done: false });
  saveList();
  renderList();
  input.value = "";
  input.focus();
});
document.querySelector(".reset-list").addEventListener("click", () => {
  items = defaultItems();
  saveList();
  renderList();
});
renderList();
