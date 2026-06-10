const tg = window.Telegram?.WebApp;
const isTelegramRuntime = Boolean(tg?.initData);
const goalsKey = "kopilka.goals.v4";
const transactionsKey = "kopilka.transactions.v4";
const expensesKey = "kopilka.expenses.v2";
const accountKey = "kopilka.account.v1";
const remindersKey = "kopilka.reminders.v1";
const currencyKey = "kopilka.currency.v1";
const currencies = {
  KZT: { symbol: "₸", locale: "ru-RU" },
  RUB: { symbol: "₽", locale: "ru-RU" },
  USD: { symbol: "$", locale: "en-US" },
};
const defaultExpenseCategory = "Еда";

const state = {
  currentView: "home",
  selectedGoalId: null,
  editingAccountEntryId: null,
  operationType: "topup",
  goals: loadList(goalsKey, []),
  transactions: loadList(transactionsKey, []).map(normalizeTransaction),
  expenses: loadList(expensesKey, []).map(normalizeExpense),
  accountEntries: loadList(accountKey, []).map(normalizeAccountEntry),
  reminders: loadList(remindersKey, []).map(normalizeReminder),
  currency: loadCurrency(),
};

const nodes = {
  screens: document.querySelectorAll(".screen"),
  totalBalance: document.querySelector("#total-balance"),
  incomeTotal: document.querySelector("#income-total"),
  expensesTotal: document.querySelector("#expenses-total"),
  goalList: document.querySelector("#goal-list"),
  homeEmpty: document.querySelector("#home-empty"),
  openCreateButton: document.querySelector("#open-create-button"),
  openAccountHistoryButton: document.querySelector("#open-account-history-button"),
  openIncomeButton: document.querySelector("#open-income-button"),
  openExpensesButton: document.querySelector("#open-expenses-button"),
  tabButtons: document.querySelectorAll("[data-tab-view]"),
  quickAmountButtons: document.querySelectorAll("[data-quick-amount]"),
  statsIncome: document.querySelector("#stats-income"),
  statsExpenses: document.querySelector("#stats-expenses"),
  statsSaved: document.querySelector("#stats-saved"),
  statsBalance: document.querySelector("#stats-balance"),
  statsExpenseMonth: document.querySelector("#stats-expense-month"),
  statsExpenseScaleTotal: document.querySelector("#stats-expense-scale-total"),
  statsExpenseScaleNote: document.querySelector("#stats-expense-scale-note"),
  statsExpenseScaleFill: document.querySelector("#stats-expense-scale-fill"),
  statsCategoryList: document.querySelector("#stats-category-list"),
  statsEmpty: document.querySelector("#stats-empty"),
  reminderForm: document.querySelector("#reminder-form"),
  reminderPurpose: document.querySelector("#reminder-purpose"),
  reminderComment: document.querySelector("#reminder-comment"),
  reminderDate: document.querySelector("#reminder-date"),
  reminderTime: document.querySelector("#reminder-time"),
  reminderList: document.querySelector("#reminder-list"),
  remindersEmpty: document.querySelector("#reminders-empty"),
  remindersCount: document.querySelector("#reminders-count"),
  reminderStatus: document.querySelector("#reminder-status"),
  clearDataButton: document.querySelector("#clear-data-button"),
  moreStatus: document.querySelector("#more-status"),
  currencySelect: document.querySelector("#currency-select"),
  detailHeading: document.querySelector("#detail-heading"),
  detailIcon: document.querySelector("#detail-icon"),
  detailTitle: document.querySelector("#detail-title"),
  detailTarget: document.querySelector("#detail-target"),
  detailSaved: document.querySelector("#detail-saved"),
  detailLeft: document.querySelector("#detail-left"),
  detailPercent: document.querySelector("#detail-percent"),
  detailProgress: document.querySelector("#detail-progress"),
  topupButton: document.querySelector("#topup-button"),
  withdrawButton: document.querySelector("#withdraw-button"),
  historyButton: document.querySelector("#history-button"),
  deleteGoalButton: document.querySelector("#delete-goal-button"),
  detailStatus: document.querySelector("#detail-status"),
  operationForm: document.querySelector("#operation-form"),
  operationGoalName: document.querySelector("#operation-goal-name"),
  operationTypeButtons: document.querySelectorAll("[data-operation-type]"),
  operationAmount: document.querySelector("#operation-amount"),
  operationComment: document.querySelector("#operation-comment"),
  operationDate: document.querySelector("#operation-date"),
  operationStatus: document.querySelector("#operation-status"),
  historyGoalName: document.querySelector("#history-goal-name"),
  historyList: document.querySelector("#history-list"),
  historyEmpty: document.querySelector("#history-empty"),
  accountHistoryBalance: document.querySelector("#account-history-balance"),
  accountHistoryList: document.querySelector("#account-history-list"),
  accountHistoryEmpty: document.querySelector("#account-history-empty"),
  accountHistoryStatus: document.querySelector("#account-history-status"),
  accountEditForm: document.querySelector("#account-edit-form"),
  accountEditType: document.querySelector("#account-edit-type"),
  accountEditAmount: document.querySelector("#account-edit-amount"),
  accountEditComment: document.querySelector("#account-edit-comment"),
  accountEditCategoryLabel: document.querySelector("#account-edit-category-label"),
  accountEditCategory: document.querySelector("#account-edit-category"),
  accountEditDate: document.querySelector("#account-edit-date"),
  accountEditStatus: document.querySelector("#account-edit-status"),
  deleteAccountEntryButton: document.querySelector("#delete-account-entry-button"),
  incomeForm: document.querySelector("#income-form"),
  incomeAmount: document.querySelector("#income-amount"),
  incomeComment: document.querySelector("#income-comment"),
  incomeDate: document.querySelector("#income-date"),
  incomeStatus: document.querySelector("#income-status"),
  expensesScreenTotal: document.querySelector("#expenses-screen-total"),
  openExpenseFormButton: document.querySelector("#open-expense-form-button"),
  expensesList: document.querySelector("#expenses-list"),
  expensesEmpty: document.querySelector("#expenses-empty"),
  expenseForm: document.querySelector("#expense-form"),
  expenseAmount: document.querySelector("#expense-amount"),
  expenseComment: document.querySelector("#expense-comment"),
  expenseCategory: document.querySelector("#expense-category"),
  expenseDate: document.querySelector("#expense-date"),
  expenseStatus: document.querySelector("#expense-status"),
  goalForm: document.querySelector("#goal-form"),
  goalTitle: document.querySelector("#goal-title"),
  goalTarget: document.querySelector("#goal-target"),
  goalIcon: document.querySelector("#goal-icon"),
  goalStatus: document.querySelector("#goal-status"),
  navButtons: document.querySelectorAll("[data-nav]"),
};

function loadList(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(goalsKey, JSON.stringify(state.goals));
  localStorage.setItem(transactionsKey, JSON.stringify(state.transactions));
  localStorage.setItem(expensesKey, JSON.stringify(state.expenses));
  localStorage.setItem(accountKey, JSON.stringify(state.accountEntries));
  localStorage.setItem(remindersKey, JSON.stringify(state.reminders));
  localStorage.setItem(currencyKey, state.currency);
}

function loadCurrency() {
  const saved = localStorage.getItem(currencyKey);
  return currencies[saved] ? saved : "KZT";
}

function normalizeTransaction(item) {
  const createdAt = item.createdAt || new Date().toISOString();
  return {
    id: item.id || crypto.randomUUID(),
    goalId: item.goalId,
    type: item.type === "withdraw" ? "withdraw" : "topup",
    amount: Number(item.amount) || 0,
    comment: item.comment || item.note || item.category || "",
    date: item.date || createdAt.slice(0, 10),
    createdAt,
  };
}

function normalizeExpense(item) {
  const createdAt = item.createdAt || new Date().toISOString();
  return {
    id: item.id || crypto.randomUUID(),
    amount: Number(item.amount) || 0,
    comment: item.comment || "",
    category: item.category || defaultExpenseCategory,
    date: item.date || createdAt.slice(0, 10),
    createdAt,
  };
}

function normalizeAccountEntry(item) {
  const createdAt = item.createdAt || new Date().toISOString();
  const type = ["income", "expense", "allocation", "return"].includes(item.type) ? item.type : "income";
  return {
    id: item.id || crypto.randomUUID(),
    type,
    amount: Number(item.amount) || 0,
    comment: item.comment || "",
    category: item.category || (type === "expense" ? defaultExpenseCategory : ""),
    date: item.date || createdAt.slice(0, 10),
    goalId: item.goalId || null,
    linkedId: item.linkedId || null,
    createdAt,
  };
}

function normalizeReminder(item) {
  const createdAt = item.createdAt || new Date().toISOString();
  return {
    id: item.id || crypto.randomUUID(),
    purpose: item.purpose || "Пополнить счет",
    comment: item.comment || "",
    date: item.date || today(),
    time: item.time || "09:00",
    createdAt,
  };
}

function ensureSelectedGoal() {
  if (!state.goals.length) {
    state.selectedGoalId = null;
    return;
  }

  if (!state.goals.some((goal) => goal.id === state.selectedGoalId)) {
    state.selectedGoalId = state.goals[0].id;
  }
}

function selectedGoal() {
  ensureSelectedGoal();
  return state.goals.find((goal) => goal.id === state.selectedGoalId) || null;
}

function formatMoney(value) {
  const currency = currencies[state.currency] || currencies.KZT;
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.max(Number(value) || 0, 0));
  return `${formatted} ${currency.symbol}`;
}

function parseAmount(value) {
  const normalized = String(value).replace(",", ".").replace(/\s/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function goalSaved(goalId) {
  return state.transactions
    .filter((item) => item.goalId === goalId)
    .reduce((total, item) => total + (item.type === "topup" ? item.amount : -item.amount), 0);
}

function goalProgress(goal) {
  const saved = Math.max(goalSaved(goal.id), 0);
  return Math.min(Math.round((saved / goal.target) * 100), 100);
}

function goalLeft(goal) {
  return Math.max(goal.target - goalSaved(goal.id), 0);
}

function totalBalance() {
  return state.accountEntries.reduce((total, item) => {
    if (item.type === "income" || item.type === "return") {
      return total + item.amount;
    }

    return total - item.amount;
  }, 0);
}

function totalExpenses() {
  return state.expenses.reduce((total, expense) => total + expense.amount, 0);
}

function totalIncome() {
  return state.accountEntries
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
}

function monthKey(date = today()) {
  return String(date).slice(0, 7);
}

function currentMonthEntries(items) {
  const current = monthKey();
  return items.filter((item) => monthKey(item.date) === current);
}

function totalSavedInGoals() {
  return state.goals.reduce((total, goal) => total + Math.max(goalSaved(goal.id), 0), 0);
}

function clampPercent(value) {
  return Math.max(0, Math.min(Number(value) || 0, 100));
}

function categoryColor(category, index = 0) {
  const colors = {
    "Еда": "#0a8dff",
    "Транспорт": "#f7c948",
    "Дом": "#22c55e",
    "Покупки": "#8b5cf6",
    "Развлечения": "#ff8a1f",
    "Здоровье": "#14b8a6",
    "Другое": "#64748b",
  };
  const fallback = ["#0a8dff", "#f7c948", "#22c55e", "#8b5cf6", "#ff8a1f", "#14b8a6", "#64748b"];
  return colors[category] || fallback[index % fallback.length];
}

function monthName() {
  const formatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
  const label = formatter.format(new Date(`${monthKey()}-01T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showView(view) {
  state.currentView = view;
  const rootView = ["home", "stats", "reminders", "more"].includes(view) ? view : "home";
  nodes.screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === `${view}-screen`);
  });
  nodes.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tabView === rootView);
  });
  document.body.classList.toggle("show-bottom-nav", ["home", "stats", "reminders", "more"].includes(view));
  clearStatuses();
  render();
}

function clearStatuses() {
  [
    nodes.detailStatus,
    nodes.operationStatus,
    nodes.goalStatus,
    nodes.accountHistoryStatus,
    nodes.accountEditStatus,
    nodes.incomeStatus,
    nodes.expenseStatus,
    nodes.reminderStatus,
    nodes.moreStatus,
  ].forEach((node) => {
    node.hidden = true;
    node.classList.remove("is-error");
    node.textContent = "";
  });
}

function showStatus(node, message, isError = false) {
  node.textContent = message;
  node.hidden = false;
  node.classList.toggle("is-error", isError);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function renderHome() {
  nodes.totalBalance.textContent = formatMoney(totalBalance());
  nodes.incomeTotal.textContent = formatMoney(totalIncome());
  nodes.expensesTotal.textContent = formatMoney(totalExpenses());
  nodes.homeEmpty.hidden = state.goals.length > 0;
  nodes.goalList.innerHTML = state.goals
    .map((goal) => {
      const saved = goalSaved(goal.id);
      const progress = goalProgress(goal);
      return `
        <article class="goal-card">
          <span class="goal-icon">${goal.icon}</span>
          <div class="goal-body">
            <div class="goal-title-row">
              <span class="goal-title">${escapeHtml(goal.title)}</span>
              <span class="goal-percent">${progress}%</span>
            </div>
            <span class="goal-meta">Цель: ${formatMoney(goal.target)} · Накоплено: ${formatMoney(saved)}</span>
            <div class="progress-track">
              <span class="progress-fill" style="width: ${progress}%"></span>
            </div>
            <button class="open-button" type="button" data-open-goal="${goal.id}">Открыть</button>
          </div>
        </article>
      `;
    })
    .join("");

  nodes.goalList.querySelectorAll("[data-open-goal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedGoalId = button.dataset.openGoal;
      showView("detail");
    });
  });
}

function renderDetail() {
  const goal = selectedGoal();
  if (!goal) {
    nodes.detailHeading.textContent = "Копилка";
    nodes.detailIcon.textContent = "💰";
    nodes.detailTitle.textContent = "Нет копилок";
    nodes.detailTarget.textContent = formatMoney(0);
    nodes.detailSaved.textContent = formatMoney(0);
    nodes.detailLeft.textContent = formatMoney(0);
    nodes.detailPercent.textContent = "0%";
    nodes.detailProgress.style.width = "0%";
    nodes.topupButton.disabled = true;
    nodes.withdrawButton.disabled = true;
    nodes.historyButton.disabled = true;
    nodes.deleteGoalButton.disabled = true;
    return;
  }

  const saved = goalSaved(goal.id);
  const left = goalLeft(goal);
  const progress = goalProgress(goal);

  nodes.detailHeading.textContent = goal.title;
  nodes.detailIcon.textContent = goal.icon;
  nodes.detailTitle.textContent = goal.title;
  nodes.detailTarget.textContent = formatMoney(goal.target);
  nodes.detailSaved.textContent = formatMoney(saved);
  nodes.detailLeft.textContent = left ? formatMoney(left) : "Цель достигнута";
  nodes.detailPercent.textContent = `${progress}%`;
  nodes.detailProgress.style.width = `${progress}%`;
  nodes.topupButton.disabled = false;
  nodes.withdrawButton.disabled = false;
  nodes.historyButton.disabled = false;
  nodes.deleteGoalButton.disabled = false;
}

function renderOperation() {
  const goal = selectedGoal();
  nodes.operationGoalName.textContent = goal ? goal.title : "Нет копилки";
  nodes.operationDate.value = nodes.operationDate.value || today();
  nodes.operationTypeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.operationType === state.operationType);
  });
}

function renderHistory() {
  const goal = selectedGoal();
  if (!goal) {
    nodes.historyGoalName.textContent = "Копилка";
    nodes.historyEmpty.hidden = false;
    nodes.historyList.innerHTML = "";
    return;
  }

  const items = state.transactions
    .filter((item) => item.goalId === goal.id)
    .slice()
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));

  nodes.historyGoalName.textContent = goal.title;
  nodes.historyEmpty.hidden = items.length > 0;
  nodes.historyList.innerHTML = items
    .map((item) => {
      const sign = item.type === "topup" ? "+" : "-";
      const title = item.comment || (item.type === "topup" ? "Пополнение" : "Снятие");
      return `
        <li class="history-item">
          <div>
            <div class="history-title">${escapeHtml(title)}</div>
            <div class="history-meta">${formatDate(item.date)}</div>
            <div class="history-actions">
              <button class="edit-operation-button" type="button" data-edit-linked-entry="${item.id}">Редактировать</button>
              <button class="delete-operation-button" type="button" data-delete-operation="${item.id}">Удалить</button>
            </div>
          </div>
          <div class="history-amount ${item.type}">${sign}${formatMoney(item.amount)}</div>
        </li>
      `;
    })
    .join("");

  nodes.historyList.querySelectorAll("[data-delete-operation]").forEach((button) => {
    button.addEventListener("click", () => deleteOperation(button.dataset.deleteOperation));
  });

  nodes.historyList.querySelectorAll("[data-edit-linked-entry]").forEach((button) => {
    button.addEventListener("click", () => openAccountEntryEditorByLinkedId(button.dataset.editLinkedEntry));
  });
}

function renderExpenses() {
  const items = state.expenses
    .slice()
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));

  nodes.expensesScreenTotal.textContent = formatMoney(totalExpenses());
  nodes.expensesEmpty.hidden = items.length > 0;
  nodes.expensesList.innerHTML = items
    .map((item) => {
      const title = item.comment || "Расход";
      return `
        <li class="history-item">
          <div>
            <div class="history-title">${escapeHtml(title)}</div>
            <div class="history-meta">${escapeHtml(item.category || defaultExpenseCategory)} · ${formatDate(item.date)}</div>
            <div class="history-actions">
              <button class="edit-operation-button" type="button" data-edit-linked-entry="${item.id}">Редактировать</button>
              <button class="delete-operation-button" type="button" data-delete-expense="${item.id}">Удалить</button>
            </div>
          </div>
          <div class="history-amount withdraw">-${formatMoney(item.amount)}</div>
        </li>
      `;
    })
    .join("");

  nodes.expensesList.querySelectorAll("[data-delete-expense]").forEach((button) => {
    button.addEventListener("click", () => deleteExpense(button.dataset.deleteExpense));
  });

  nodes.expensesList.querySelectorAll("[data-edit-linked-entry]").forEach((button) => {
    button.addEventListener("click", () => openAccountEntryEditorByLinkedId(button.dataset.editLinkedEntry));
  });
}

function renderStatistics() {
  const monthAccountEntries = currentMonthEntries(state.accountEntries);
  const monthExpenses = currentMonthEntries(state.expenses);
  const income = monthAccountEntries
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
  const spent = monthExpenses.reduce((total, item) => total + item.amount, 0);
  const categoryTotals = monthExpenses.reduce((result, item) => {
    const category = item.category || defaultExpenseCategory;
    result[category] = (result[category] || 0) + item.amount;
    return result;
  }, {});
  const categoryItems = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const scaleMax = Math.max(income, spent, 1);
  const totalScalePercent = clampPercent((spent / scaleMax) * 100);
  const spentIncomePercent = income ? Math.round((spent / income) * 100) : spent ? 100 : 0;

  nodes.statsIncome.textContent = formatMoney(income);
  nodes.statsExpenses.textContent = formatMoney(spent);
  nodes.statsSaved.textContent = formatMoney(totalSavedInGoals());
  nodes.statsBalance.textContent = formatMoney(totalBalance());
  nodes.statsExpenseMonth.textContent = monthName();
  nodes.statsExpenseScaleTotal.textContent = formatMoney(spent);
  nodes.statsExpenseScaleNote.textContent = income
    ? `${spentIncomePercent}% от дохода`
    : spent
      ? "Доходов нет"
      : "Расходов нет";
  nodes.statsExpenseScaleFill.style.width = `${totalScalePercent}%`;
  nodes.statsExpenseScaleFill.innerHTML = categoryItems
    .map(([category, amount], index) => {
      const segmentPercent = spent ? (amount / spent) * 100 : 0;
      return `<span class="expense-scale-segment" style="flex-basis: ${segmentPercent}%; --category-color: ${categoryColor(category, index)}"></span>`;
    })
    .join("");
  nodes.statsEmpty.hidden = categoryItems.length > 0;
  nodes.statsCategoryList.innerHTML = categoryItems
    .map(([category, amount], index) => {
      const percent = spent ? Math.round((amount / spent) * 100) : 0;
      return `
        <div class="category-row" style="--category-color: ${categoryColor(category, index)}">
          <div class="category-row-header">
            <strong>${escapeHtml(category)}</strong>
            <span>${formatMoney(amount)} · ${percent}%</span>
          </div>
          <div class="category-track">
            <span class="category-fill" style="width: ${percent}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function reminderTimestamp(item) {
  return `${item.date}T${item.time || "09:00"}:00`;
}

function reminderDateLabel(item) {
  return new Date(reminderTimestamp(item)).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isReminderOverdue(item) {
  return new Date(reminderTimestamp(item)).getTime() < Date.now();
}

function renderReminders() {
  const items = state.reminders
    .slice()
    .sort((a, b) => reminderTimestamp(a).localeCompare(reminderTimestamp(b)));

  nodes.remindersCount.textContent = String(items.length);
  nodes.remindersEmpty.hidden = items.length > 0;
  nodes.reminderList.innerHTML = items
    .map((item) => {
      const overdue = isReminderOverdue(item);
      const comment = item.comment || "Без комментария";
      return `
        <li class="reminder-item">
          <div class="reminder-top">
            <div>
              <div class="reminder-purpose">${escapeHtml(item.purpose)}</div>
              <div class="reminder-comment">${escapeHtml(comment)}</div>
            </div>
            <span class="reminder-date ${overdue ? "is-overdue" : ""}">${reminderDateLabel(item)}</span>
          </div>
          <div class="reminder-actions">
            <button class="edit-operation-button" type="button" data-complete-reminder="${item.id}">Готово</button>
            <button class="delete-operation-button" type="button" data-delete-reminder="${item.id}">Удалить</button>
          </div>
        </li>
      `;
    })
    .join("");

  nodes.reminderList.querySelectorAll("[data-complete-reminder]").forEach((button) => {
    button.addEventListener("click", () => deleteReminder(button.dataset.completeReminder));
  });

  nodes.reminderList.querySelectorAll("[data-delete-reminder]").forEach((button) => {
    button.addEventListener("click", () => deleteReminder(button.dataset.deleteReminder));
  });
}

function accountEntryTitle(item) {
  if (item.comment) return item.comment;

  if (item.type === "income") return "Доход";
  if (item.type === "expense") return "Расход";
  if (item.type === "allocation") return "В копилку";
  return "Возврат на счет";
}

function accountEntrySign(item) {
  return item.type === "income" || item.type === "return" ? "+" : "-";
}

function accountEntryMeta(item) {
  const parts = [accountEntryTypeLabel(item)];
  if (item.type === "expense") {
    parts.push(item.category || defaultExpenseCategory);
  }
  parts.push(formatDate(item.date));
  return parts.join(" · ");
}

function accountEntryTypeLabel(item) {
  if (item.type === "income") return "Доход";
  if (item.type === "expense") return "Расход";
  if (item.type === "allocation") return "Распределение в копилку";
  return "Возврат на счет";
}

function renderAccountHistory() {
  const items = state.accountEntries
    .slice()
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));

  nodes.accountHistoryBalance.textContent = formatMoney(totalBalance());
  nodes.accountHistoryEmpty.hidden = items.length > 0;
  nodes.accountHistoryList.innerHTML = items
    .map((item) => {
      return `
        <li class="history-item">
          <div>
            <div class="history-title">${escapeHtml(accountEntryTitle(item))}</div>
            <div class="history-meta">${escapeHtml(accountEntryMeta(item))}</div>
            <div class="history-actions">
              <button class="edit-operation-button" type="button" data-edit-account-entry="${item.id}">Редактировать</button>
              <button class="delete-operation-button" type="button" data-delete-account-entry="${item.id}">Удалить</button>
            </div>
          </div>
          <div class="history-amount ${item.type}">${accountEntrySign(item)}${formatMoney(item.amount)}</div>
        </li>
      `;
    })
    .join("");

  nodes.accountHistoryList.querySelectorAll("[data-edit-account-entry]").forEach((button) => {
    button.addEventListener("click", () => openAccountEntryEditor(button.dataset.editAccountEntry));
  });

  nodes.accountHistoryList.querySelectorAll("[data-delete-account-entry]").forEach((button) => {
    button.addEventListener("click", () => deleteAccountEntry(button.dataset.deleteAccountEntry, nodes.accountHistoryStatus));
  });
}

function render() {
  ensureSelectedGoal();
  renderHome();
  renderDetail();
  renderOperation();
  renderHistory();
  renderExpenses();
  renderStatistics();
  renderReminders();
  renderAccountHistory();
  if (nodes.currencySelect) {
    nodes.currencySelect.value = state.currency;
  }
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function signedAccountAmount(entry, amount = entry.amount) {
  return entry.type === "income" || entry.type === "return" ? amount : -amount;
}

function projectedBalance(entry, amount) {
  return totalBalance() - signedAccountAmount(entry) + signedAccountAmount(entry, amount);
}

function projectedGoalSaved(entry, amount) {
  if (!entry.goalId || !["allocation", "return"].includes(entry.type)) {
    return null;
  }

  const currentSaved = goalSaved(entry.goalId);
  const oldEffect = entry.type === "allocation" ? entry.amount : -entry.amount;
  const newEffect = entry.type === "allocation" ? amount : -amount;
  return currentSaved - oldEffect + newEffect;
}

function validateAccountEntryChange(entry, amount) {
  if (projectedBalance(entry, amount) < 0) {
    return "После изменения общий счет уйдет в минус. Сначала исправьте другие записи.";
  }

  const saved = projectedGoalSaved(entry, amount);
  if (saved !== null && saved < 0) {
    return "После изменения в копилке получится отрицательная сумма. Такую запись нельзя сохранить.";
  }

  return "";
}

function syncLinkedAccountEntry(entry) {
  if (entry.type === "expense") {
    const expense = state.expenses.find((item) => item.id === entry.linkedId);
    if (!expense) return;

    expense.amount = entry.amount;
    expense.comment = entry.comment;
    expense.category = entry.category || defaultExpenseCategory;
    expense.date = entry.date;
    return;
  }

  if (!["allocation", "return"].includes(entry.type)) return;

  const transaction = state.transactions.find((item) => item.id === entry.linkedId);
  if (!transaction) return;

  transaction.amount = entry.amount;
  transaction.comment = entry.comment;
  transaction.date = entry.date;
}

function openAccountEntryEditor(entryId) {
  const entry = state.accountEntries.find((item) => item.id === entryId);
  if (!entry) return;

  state.editingAccountEntryId = entry.id;
  nodes.accountEditType.textContent = accountEntryTypeLabel(entry);
  nodes.accountEditAmount.value = entry.amount;
  nodes.accountEditComment.value = entry.comment;
  nodes.accountEditCategoryLabel.hidden = entry.type !== "expense";
  nodes.accountEditCategory.value = entry.category || defaultExpenseCategory;
  nodes.accountEditDate.value = entry.date;
  showView("account-edit");
}

function openAccountEntryEditorByLinkedId(linkedId) {
  const entry = state.accountEntries.find((item) => item.linkedId === linkedId);
  if (!entry) return;

  openAccountEntryEditor(entry.id);
}

function saveAccountEntryEdit(event) {
  event.preventDefault();
  const entry = state.accountEntries.find((item) => item.id === state.editingAccountEntryId);
  if (!entry) {
    showView("account-history");
    return;
  }

  const amount = parseAmount(nodes.accountEditAmount.value);
  if (!amount) {
    showStatus(nodes.accountEditStatus, "Введите сумму больше нуля.", true);
    nodes.accountEditAmount.focus();
    return;
  }

  const validationMessage = validateAccountEntryChange(entry, amount);
  if (validationMessage) {
    showStatus(nodes.accountEditStatus, validationMessage, true);
    return;
  }

  entry.amount = amount;
  entry.comment = nodes.accountEditComment.value.trim();
  entry.category = entry.type === "expense" ? nodes.accountEditCategory.value : "";
  entry.date = nodes.accountEditDate.value || today();
  syncLinkedAccountEntry(entry);
  saveState();
  notifyTelegramSave();
  showView("account-history");
}

function openOperation(type) {
  if (!selectedGoal()) {
    showView("create");
    return;
  }

  state.operationType = type;
  nodes.operationForm.reset();
  nodes.operationDate.value = today();
  showView("operation");
}

function openIncomeForm() {
  nodes.incomeForm.reset();
  nodes.incomeDate.value = today();
  showView("income");
}

function openExpenseForm() {
  nodes.expenseForm.reset();
  nodes.expenseCategory.value = defaultExpenseCategory;
  nodes.expenseDate.value = today();
  showView("expense-form");
}

function prepareReminderForm() {
  nodes.reminderDate.value = nodes.reminderDate.value || today();
  nodes.reminderTime.value = nodes.reminderTime.value || currentTime();
}

function applyQuickAmount(button) {
  const input = document.querySelector(`#${button.dataset.quickTarget}`);
  if (!input) return;

  const current = parseAmount(input.value) || 0;
  const amount = Number(button.dataset.quickAmount) || 0;
  input.value = current + amount;
  input.focus();
}

function createOperation(event) {
  event.preventDefault();
  const goal = selectedGoal();
  if (!goal) {
    showStatus(nodes.operationStatus, "Сначала создайте копилку.", true);
    return;
  }

  const amount = parseAmount(nodes.operationAmount.value);
  const saved = goalSaved(goal.id);
  const account = totalBalance();

  if (!amount) {
    showStatus(nodes.operationStatus, "Введите сумму больше нуля.", true);
    nodes.operationAmount.focus();
    return;
  }

  if (state.operationType === "topup" && amount > account) {
    showStatus(nodes.operationStatus, "На общем счете недостаточно денег для пополнения копилки.", true);
    nodes.operationAmount.focus();
    return;
  }

  if (state.operationType === "withdraw" && amount > saved) {
    showStatus(nodes.operationStatus, "Нельзя снять больше, чем есть в копилке.", true);
    nodes.operationAmount.focus();
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    goalId: goal.id,
    type: state.operationType,
    amount,
    comment: nodes.operationComment.value.trim(),
    date: nodes.operationDate.value || today(),
    createdAt: new Date().toISOString(),
  };

  state.transactions.push(transaction);
  state.accountEntries.push({
    id: crypto.randomUUID(),
    type: state.operationType === "topup" ? "allocation" : "return",
    amount,
    comment:
      state.operationType === "topup"
        ? `В копилку: ${goal.title}`
        : `Из копилки: ${goal.title}`,
    date: transaction.date,
    goalId: goal.id,
    linkedId: transaction.id,
    createdAt: new Date().toISOString(),
  });
  saveState();
  notifyTelegramSave();
  showView("history");
}

function createIncome(event) {
  event.preventDefault();
  const amount = parseAmount(nodes.incomeAmount.value);

  if (!amount) {
    showStatus(nodes.incomeStatus, "Введите сумму дохода больше нуля.", true);
    nodes.incomeAmount.focus();
    return;
  }

  state.accountEntries.push({
    id: crypto.randomUUID(),
    type: "income",
    amount,
    comment: nodes.incomeComment.value.trim(),
    date: nodes.incomeDate.value || today(),
    goalId: null,
    linkedId: null,
    createdAt: new Date().toISOString(),
  });

  saveState();
  notifyTelegramSave();
  showView("home");
}

function createGoal(event) {
  event.preventDefault();
  const title = nodes.goalTitle.value.trim();
  const target = parseAmount(nodes.goalTarget.value);

  if (!title) {
    showStatus(nodes.goalStatus, "Введите название копилки.", true);
    nodes.goalTitle.focus();
    return;
  }

  if (!target) {
    showStatus(nodes.goalStatus, "Введите сумму цели больше нуля.", true);
    nodes.goalTarget.focus();
    return;
  }

  const goal = {
    id: crypto.randomUUID(),
    title,
    target,
    icon: nodes.goalIcon.value,
  };

  state.goals.push(goal);
  state.selectedGoalId = goal.id;
  saveState();
  nodes.goalForm.reset();
  showView("detail");
}

function createExpense(event) {
  event.preventDefault();
  const amount = parseAmount(nodes.expenseAmount.value);

  if (!amount) {
    showStatus(nodes.expenseStatus, "Введите сумму расхода больше нуля.", true);
    nodes.expenseAmount.focus();
    return;
  }

  if (amount > totalBalance()) {
    showStatus(nodes.expenseStatus, "На общем счете недостаточно денег для этого расхода.", true);
    nodes.expenseAmount.focus();
    return;
  }

  const expense = {
    id: crypto.randomUUID(),
    amount,
    comment: nodes.expenseComment.value.trim(),
    category: nodes.expenseCategory.value || defaultExpenseCategory,
    date: nodes.expenseDate.value || today(),
    createdAt: new Date().toISOString(),
  };

  state.expenses.push(expense);
  state.accountEntries.push({
    id: crypto.randomUUID(),
    type: "expense",
    amount,
    comment: expense.comment || "Расход",
    category: expense.category,
    date: expense.date,
    goalId: null,
    linkedId: expense.id,
    createdAt: new Date().toISOString(),
  });

  saveState();
  notifyTelegramSave();
  showView("home");
}

function createReminder(event) {
  event.preventDefault();
  const reminder = {
    id: crypto.randomUUID(),
    purpose: nodes.reminderPurpose.value,
    comment: nodes.reminderComment.value.trim(),
    date: nodes.reminderDate.value || today(),
    time: nodes.reminderTime.value || currentTime(),
    createdAt: new Date().toISOString(),
  };

  state.reminders.push(reminder);
  saveState();
  nodes.reminderForm.reset();
  prepareReminderForm();
  showStatus(nodes.reminderStatus, "Напоминание добавлено.");
  render();
}

function deleteSelectedGoal() {
  const goal = selectedGoal();
  if (!goal) {
    showView("home");
    return;
  }

  const saved = goalSaved(goal.id);
  if (saved > 0) {
    state.accountEntries.push({
      id: crypto.randomUUID(),
      type: "return",
      amount: saved,
      comment: `Удаление копилки: ${goal.title}`,
      date: today(),
      goalId: goal.id,
      linkedId: null,
      createdAt: new Date().toISOString(),
    });
  }

  state.goals = state.goals.filter((item) => item.id !== goal.id);
  state.transactions = state.transactions.filter((item) => item.goalId !== goal.id);
  state.selectedGoalId = state.goals[0]?.id || null;
  saveState();
  showView("home");
}

function deleteOperation(operationId) {
  state.transactions = state.transactions.filter((item) => item.id !== operationId);
  state.accountEntries = state.accountEntries.filter((item) => item.linkedId !== operationId);
  saveState();
  render();
}

function deleteExpense(expenseId) {
  state.expenses = state.expenses.filter((item) => item.id !== expenseId);
  state.accountEntries = state.accountEntries.filter((item) => item.linkedId !== expenseId);
  saveState();
  render();
}

function deleteAccountEntry(entryId, statusNode = nodes.accountEditStatus) {
  const entry = state.accountEntries.find((item) => item.id === entryId);
  if (!entry) {
    showView("account-history");
    return;
  }

  const validationMessage = validateAccountEntryChange(entry, 0);
  if (validationMessage) {
    showStatus(statusNode, validationMessage, true);
    return;
  }

  state.accountEntries = state.accountEntries.filter((item) => item.id !== entry.id);

  if (entry.type === "expense") {
    state.expenses = state.expenses.filter((item) => item.id !== entry.linkedId);
  }

  if (entry.type === "allocation" || entry.type === "return") {
    state.transactions = state.transactions.filter((item) => item.id !== entry.linkedId);
  }

  state.editingAccountEntryId = null;
  saveState();
  notifyTelegramSave();
  showView("account-history");
}

function deleteReminder(reminderId) {
  state.reminders = state.reminders.filter((item) => item.id !== reminderId);
  saveState();
  render();
}

function clearAllData() {
  const confirmed = window.confirm("Удалить все данные Копилки? Это действие нельзя отменить.");
  if (!confirmed) return;

  state.selectedGoalId = null;
  state.editingAccountEntryId = null;
  state.goals = [];
  state.transactions = [];
  state.expenses = [];
  state.accountEntries = [];
  state.reminders = [];
  state.currency = "KZT";
  localStorage.removeItem(goalsKey);
  localStorage.removeItem(transactionsKey);
  localStorage.removeItem(expensesKey);
  localStorage.removeItem(accountKey);
  localStorage.removeItem(remindersKey);
  localStorage.removeItem(currencyKey);
  saveState();
  showStatus(nodes.moreStatus, "Данные очищены.");
  render();
}

function notifyTelegramSave() {
  if (!isTelegramRuntime || !tg?.HapticFeedback) return;

  tg.HapticFeedback.notificationOccurred("success");
}

function applyTelegramTheme() {
  if (!isTelegramRuntime || !tg) return;

  tg.ready();
  tg.expand();
}

nodes.openCreateButton.addEventListener("click", () => {
  nodes.goalForm.reset();
  showView("create");
});
nodes.openAccountHistoryButton.addEventListener("click", () => showView("account-history"));
nodes.openIncomeButton.addEventListener("click", openIncomeForm);
nodes.openExpensesButton.addEventListener("click", openExpenseForm);
nodes.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.tabView === "reminders") {
      prepareReminderForm();
    }

    showView(button.dataset.tabView);
  });
});
nodes.quickAmountButtons.forEach((button) => {
  button.addEventListener("click", () => applyQuickAmount(button));
});
nodes.navButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.nav));
});
nodes.openExpenseFormButton.addEventListener("click", openExpenseForm);
nodes.topupButton.addEventListener("click", () => openOperation("topup"));
nodes.withdrawButton.addEventListener("click", () => openOperation("withdraw"));
nodes.historyButton.addEventListener("click", () => showView("history"));
nodes.deleteGoalButton.addEventListener("click", deleteSelectedGoal);
nodes.operationTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.operationType = button.dataset.operationType;
    renderOperation();
  });
});
nodes.operationForm.addEventListener("submit", createOperation);
nodes.accountEditForm.addEventListener("submit", saveAccountEntryEdit);
nodes.deleteAccountEntryButton.addEventListener("click", () => deleteAccountEntry(state.editingAccountEntryId));
nodes.incomeForm.addEventListener("submit", createIncome);
nodes.expenseForm.addEventListener("submit", createExpense);
nodes.reminderForm.addEventListener("submit", createReminder);
nodes.clearDataButton.addEventListener("click", clearAllData);
nodes.goalForm.addEventListener("submit", createGoal);
nodes.currencySelect?.addEventListener("change", () => {
  state.currency = currencies[nodes.currencySelect.value] ? nodes.currencySelect.value : "KZT";
  saveState();
  render();
});

applyTelegramTheme();
ensureSelectedGoal();
document.body.classList.add("show-bottom-nav");
saveState();
render();
