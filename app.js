const tg = window.Telegram?.WebApp;
const isTelegramRuntime = Boolean(tg?.initData);
const goalsKey = "kopilka.goals.v2";
const transactionsKey = "kopilka.transactions.v2";

const defaultGoals = [
  { id: "phone", title: "Новый телефон", target: 500000, icon: "📱" },
  { id: "car", title: "Машина", target: 3000000, icon: "🚙" },
  { id: "vacation", title: "Отпуск в Турции", target: 700000, icon: "🏝️" },
];

const defaultTransactions = [
  {
    id: "demo-1",
    goalId: "phone",
    type: "topup",
    amount: 120000,
    comment: "Старт накоплений",
    date: "2026-06-01",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "demo-2",
    goalId: "car",
    type: "topup",
    amount: 750000,
    comment: "Бонус",
    date: "2026-06-02",
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "demo-3",
    goalId: "vacation",
    type: "topup",
    amount: 200000,
    comment: "Подработка",
    date: "2026-06-03",
    createdAt: "2026-06-03T10:00:00.000Z",
  },
];

const state = {
  currentView: "home",
  selectedGoalId: null,
  operationType: "topup",
  goals: loadList(goalsKey, defaultGoals),
  transactions: loadList(transactionsKey, defaultTransactions).map(normalizeTransaction),
};

const nodes = {
  screens: document.querySelectorAll(".screen"),
  totalBalance: document.querySelector("#total-balance"),
  goalList: document.querySelector("#goal-list"),
  openCreateButton: document.querySelector("#open-create-button"),
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
    return Array.isArray(saved) && saved.length ? saved : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(goalsKey, JSON.stringify(state.goals));
  localStorage.setItem(transactionsKey, JSON.stringify(state.transactions));
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

function ensureSelectedGoal() {
  if (!state.goals.length) {
    state.goals = defaultGoals;
    state.transactions = defaultTransactions.map(normalizeTransaction);
  }

  if (!state.goals.some((goal) => goal.id === state.selectedGoalId)) {
    state.selectedGoalId = state.goals[0].id;
  }
}

function selectedGoal() {
  ensureSelectedGoal();
  return state.goals.find((goal) => goal.id === state.selectedGoalId);
}

function formatMoney(value) {
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.max(Number(value) || 0, 0));
  return `${formatted} ₸`;
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
  return state.goals.reduce((total, goal) => total + goalSaved(goal.id), 0);
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
  nodes.screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === `${view}-screen`);
  });
  clearStatuses();
  render();
}

function clearStatuses() {
  [nodes.detailStatus, nodes.operationStatus, nodes.goalStatus].forEach((node) => {
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

function renderHome() {
  nodes.totalBalance.textContent = formatMoney(totalBalance());
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
  nodes.deleteGoalButton.disabled = state.goals.length <= 1;
}

function renderOperation() {
  const goal = selectedGoal();
  nodes.operationGoalName.textContent = goal.title;
  nodes.operationDate.value = nodes.operationDate.value || today();
  nodes.operationTypeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.operationType === state.operationType);
  });
}

function renderHistory() {
  const goal = selectedGoal();
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
            <button class="delete-operation-button" type="button" data-delete-operation="${item.id}">Удалить</button>
          </div>
          <div class="history-amount ${item.type}">${sign}${formatMoney(item.amount)}</div>
        </li>
      `;
    })
    .join("");

  nodes.historyList.querySelectorAll("[data-delete-operation]").forEach((button) => {
    button.addEventListener("click", () => deleteOperation(button.dataset.deleteOperation));
  });
}

function render() {
  ensureSelectedGoal();
  renderHome();
  renderDetail();
  renderOperation();
  renderHistory();
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function openOperation(type) {
  state.operationType = type;
  nodes.operationForm.reset();
  nodes.operationDate.value = today();
  showView("operation");
}

function createOperation(event) {
  event.preventDefault();
  const goal = selectedGoal();
  const amount = parseAmount(nodes.operationAmount.value);
  const saved = goalSaved(goal.id);

  if (!amount) {
    showStatus(nodes.operationStatus, "Введите сумму больше нуля.", true);
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
  saveState();
  notifyTelegramSave();
  showView("history");
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

function deleteSelectedGoal() {
  const goal = selectedGoal();

  if (state.goals.length <= 1) {
    showStatus(nodes.detailStatus, "Нельзя удалить последнюю копилку.", true);
    return;
  }

  state.goals = state.goals.filter((item) => item.id !== goal.id);
  state.transactions = state.transactions.filter((item) => item.goalId !== goal.id);
  state.selectedGoalId = state.goals[0].id;
  saveState();
  showView("home");
}

function deleteOperation(operationId) {
  state.transactions = state.transactions.filter((item) => item.id !== operationId);
  saveState();
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
nodes.navButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.nav));
});
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
nodes.goalForm.addEventListener("submit", createGoal);

applyTelegramTheme();
ensureSelectedGoal();
saveState();
render();
