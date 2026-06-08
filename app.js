const tg = window.Telegram?.WebApp;
const isTelegramRuntime = Boolean(tg?.initData);
const storageKey = "kopilka.transactions.v1";

const categories = {
  expense: ["Еда", "Транспорт", "Дом", "Здоровье", "Развлечения", "Другое"],
  income: ["Зарплата", "Подработка", "Подарок", "Возврат", "Другое"],
};

const fallbackUser = {
  first_name: "Гость",
  id: null,
};

const state = {
  type: "expense",
  user: isTelegramRuntime ? tg?.initDataUnsafe?.user || fallbackUser : fallbackUser,
  transactions: loadTransactions(),
};

const nodes = {
  userPill: document.querySelector("#user-pill"),
  runtimeLabel: document.querySelector("#runtime-label"),
  balance: document.querySelector("#balance"),
  incomeTotal: document.querySelector("#income-total"),
  expenseTotal: document.querySelector("#expense-total"),
  typeButtons: document.querySelectorAll(".type-button"),
  form: document.querySelector("#entry-form"),
  amount: document.querySelector("#amount"),
  category: document.querySelector("#category"),
  note: document.querySelector("#note"),
  clearButton: document.querySelector("#clear-button"),
  transactionList: document.querySelector("#transaction-list"),
  emptyState: document.querySelector("#empty-state"),
  sendStatus: document.querySelector("#send-status"),
};

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(storageKey, JSON.stringify(state.transactions));
}

function formatMoney(value) {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} ₸`;
}

function initials(user) {
  const firstName = user?.first_name?.trim() || "";
  const lastName = user?.last_name?.trim() || "";
  const text = lastName ? `${firstName[0] || "T"}${lastName[0]}` : firstName.slice(0, 2) || "TG";
  return text.toUpperCase();
}

function applyTelegramTheme() {
  const params = tg?.themeParams || {};
  const isDark = tg?.colorScheme === "dark";

  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.documentElement.style.setProperty("--bg", params.bg_color || (isDark ? "#101713" : "#f3f5f2"));
  document.documentElement.style.setProperty("--panel", params.secondary_bg_color || (isDark ? "#1b241f" : "#ffffff"));
  document.documentElement.style.setProperty("--panel-soft", isDark ? "#202d26" : "#eef4ef");
  document.documentElement.style.setProperty("--text", params.text_color || (isDark ? "#f4f8f5" : "#18211d"));
  document.documentElement.style.setProperty("--muted", params.hint_color || (isDark ? "#9eaaa3" : "#65736a"));
  document.documentElement.style.setProperty("--accent", params.button_color || "#17845f");
  document.documentElement.style.setProperty("--accent-strong", params.link_color || "#0f684c");
}

function setType(type) {
  state.type = type;
  nodes.typeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.type === type);
  });

  nodes.category.innerHTML = categories[type]
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");

  if (isTelegramRuntime && tg?.MainButton) {
    tg.MainButton.setText(type === "expense" ? "Добавить расход" : "Добавить доход");
    tg.MainButton.show();
  }
}

function totals() {
  return state.transactions.reduce(
    (acc, item) => {
      if (item.type === "income") {
        acc.income += item.amount;
      } else {
        acc.expense += item.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 },
  );
}

function renderSummary() {
  const total = totals();
  nodes.incomeTotal.textContent = formatMoney(total.income);
  nodes.expenseTotal.textContent = formatMoney(total.expense);
  nodes.balance.textContent = formatMoney(total.income - total.expense);
}

function renderTransactions() {
  nodes.emptyState.hidden = state.transactions.length > 0;
  nodes.transactionList.innerHTML = state.transactions
    .slice()
    .reverse()
    .map((item) => {
      const sign = item.type === "income" ? "+" : "-";
      const note = item.note ? ` · ${escapeHtml(item.note)}` : "";
      return `
        <li class="transaction-item">
          <div>
            <div class="transaction-title">${escapeHtml(item.category)}</div>
            <div class="transaction-meta">${new Date(item.createdAt).toLocaleDateString("ru-RU")}${note}</div>
          </div>
          <div class="transaction-amount ${item.type}">${sign}${formatMoney(item.amount)}</div>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseAmount(value) {
  const normalized = value.replace(",", ".").replace(/\s/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function buildTransaction() {
  const amount = parseAmount(nodes.amount.value);
  if (!amount) {
    nodes.amount.focus();
    return null;
  }

  return {
    id: crypto.randomUUID(),
    type: state.type,
    amount,
    category: nodes.category.value,
    note: nodes.note.value.trim(),
    userId: state.user.id || null,
    createdAt: new Date().toISOString(),
  };
}

function sendToTelegram(transaction) {
  const payload = {
    action: "create_transaction",
    transaction,
  };

  if (isTelegramRuntime && tg?.sendData) {
    tg.sendData(JSON.stringify(payload));
    return;
  }

  nodes.sendStatus.hidden = false;
  nodes.sendStatus.textContent = `Сохранено для теста. В Telegram бот получит: ${transaction.type === "income" ? "доход" : "расход"} ${formatMoney(transaction.amount)}.`;
}

function addTransaction(event) {
  event?.preventDefault();
  const transaction = buildTransaction();
  if (!transaction) return;

  state.transactions.push(transaction);
  saveTransactions();
  render();
  nodes.form.reset();
  setType(state.type);
  sendToTelegram(transaction);
}

function clearTransactions() {
  state.transactions = [];
  saveTransactions();
  nodes.sendStatus.hidden = true;
  render();
}

function renderUser() {
  nodes.userPill.textContent = "💰";
  nodes.runtimeLabel.textContent = isTelegramRuntime ? "Telegram" : "Браузер";
}

function render() {
  renderSummary();
  renderTransactions();
}

nodes.typeButtons.forEach((button) => {
  button.addEventListener("click", () => setType(button.dataset.type));
});
nodes.form.addEventListener("submit", addTransaction);
nodes.clearButton.addEventListener("click", clearTransactions);

if (isTelegramRuntime && tg) {
  tg.ready();
  tg.expand();
  tg.MainButton.onClick(addTransaction);
}

applyTelegramTheme();
renderUser();
setType(state.type);
render();
