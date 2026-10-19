const toast = document.getElementById("toast");
const modal = document.getElementById("memberModal");
const form = document.getElementById("memberForm");
const modalFields = document.getElementById("modalFields");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
let toastTimer;
let activeAction = "";
let editingMemberId = null;

const emptyData = {
  members: [],
  contributions: [],
  loans: [],
  transactions: [],
  settings: {
    chamaName: "Akiba Chama Management",
    adminName: "Chama Admin",
    adminEmail: ""
  }
};
const savedData = localStorage.getItem("akibaDashboardData");
const data = savedData ? { ...emptyData, ...JSON.parse(savedData) } : emptyData;
data.settings = { ...emptyData.settings, ...data.settings };

function showMessage(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function saveData() {
  localStorage.setItem("akibaDashboardData", JSON.stringify(data));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2
  }).format(amount);
}

function currentBalance() {
  const income = data.transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = data.transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  return income - expenses;
}

function renderDashboard() {
  const currentDate = document.getElementById("currentDate");
  currentDate.textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const totalContributions = data.contributions.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = data.transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  document.getElementById("totalMembers").textContent = data.members.length;
  document.getElementById("totalContributions").textContent = formatCurrency(totalContributions);
  document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses);
  document.getElementById("availableBalance").textContent = formatCurrency(currentBalance());

  const list = document.getElementById("transactionsList");
  const emptyState = document.getElementById("transactionsEmpty");
  const transactions = [...data.transactions].reverse().slice(0, 5);
  list.replaceChildren();
  emptyState.hidden = transactions.length > 0;

  transactions.forEach((transaction) => {
    const item = document.createElement("div");
    item.className = "transaction-item";

    const details = document.createElement("div");
    const title = document.createElement("strong");
    const date = document.createElement("small");
    title.textContent = transaction.description;
    date.textContent = new Date(transaction.date).toLocaleDateString("en-GB");
    details.append(title, date);

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.textContent = `${transaction.type === "expense" ? "−" : "+"}${formatCurrency(transaction.amount)}`;
    item.append(details, amount);
    list.append(item);
  });

  const now = new Date();
  const monthTransactions = data.transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthContributions = data.contributions
    .filter((contribution) => {
      const date = new Date(contribution.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const monthIncome = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthExpenses = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlySummaryTitle = document.getElementById("monthlySummaryTitle");
  const monthlySummaryDescription = document.getElementById("monthlySummaryDescription");
  if (monthTransactions.length > 0) {
    monthlySummaryTitle.textContent = "This month so far";
    monthlySummaryDescription.textContent =
      `Contributions: ${formatCurrency(monthContributions)} · Other income: ${formatCurrency(monthIncome - monthContributions)} · Expenses: ${formatCurrency(monthExpenses)}.`;
  }

  document.querySelector(".sidebar-footer span").textContent = data.settings.chamaName;
  document.title = `${data.settings.chamaName} | Chama Dashboard`;
  const profileName = document.querySelector("#profileButton span:not(.avatar)");
  if (profileName) {
    profileName.textContent = data.settings.adminName;
  }

  renderMembers();
}

function renderMembers() {
  const tableBody = document.getElementById("membersTableBody");
  const emptyState = document.getElementById("membersEmptyState");
  const tableWrap = document.getElementById("membersTableWrap");
  const search = document.getElementById("memberSearch");
  const roleFilter = document.getElementById("memberRoleFilter");
  const query = search.value.trim().toLocaleLowerCase();
  const selectedRole = roleFilter.value;
  const roles = [...new Set(data.members.map((member) => member.role).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

  roleFilter.replaceChildren(new Option("All roles", "all"));
  roles.forEach((role) => roleFilter.add(new Option(role, role)));
  roleFilter.value = roles.includes(selectedRole) ? selectedRole : "all";

  document.getElementById("membersPageTotal").textContent = data.members.length;
  document.getElementById("membersPageLeadership").textContent =
    data.members.filter((member) => member.role && member.role !== "Member").length;
  document.getElementById("membersPageRoles").textContent = roles.length;

  const matchingMembers = data.members.filter((member) => {
    const matchesRole = roleFilter.value === "all" || member.role === roleFilter.value;
    const searchableText = `${member.name} ${member.phone} ${member.email} ${member.role}`
      .toLocaleLowerCase();
    return matchesRole && searchableText.includes(query);
  });

  document.getElementById("memberResultCount").textContent = matchingMembers.length;
  tableBody.replaceChildren();
  tableWrap.hidden = matchingMembers.length === 0;
  emptyState.hidden = matchingMembers.length > 0;

  if (data.members.length === 0) {
    document.getElementById("membersEmptyTitle").textContent = "No members yet";
    document.getElementById("membersEmptyDescription").textContent =
      "Add your first member to start building your chama directory.";
    document.getElementById("emptyAddMemberButton").hidden = false;
  } else if (matchingMembers.length === 0) {
    document.getElementById("membersEmptyTitle").textContent = "No matching members";
    document.getElementById("membersEmptyDescription").textContent =
      "Try a different name, contact detail, or role.";
    document.getElementById("emptyAddMemberButton").hidden = true;
  }

  matchingMembers.forEach((member) => {
    const row = document.createElement("tr");
    const identityCell = document.createElement("td");
    const identity = document.createElement("div");
    identity.className = "member-identity";
    const avatar = document.createElement("span");
    avatar.className = "member-avatar";
    avatar.textContent = member.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase())
      .join("");
    const identityText = document.createElement("div");
    identityText.className = "member-identity-text";
    const name = document.createElement("strong");
    name.textContent = member.name;
    const memberId = document.createElement("small");
    memberId.textContent = `Member · ${member.id.slice(-6)}`;
    identityText.append(name, memberId);
    identity.append(avatar, identityText);
    identityCell.append(identity);

    const roleCell = document.createElement("td");
    const role = document.createElement("span");
    role.className = "member-role";
    role.textContent = member.role || "Member";
    roleCell.append(role);

    const phoneCell = document.createElement("td");
    phoneCell.textContent = member.phone || "—";
    const emailCell = document.createElement("td");
    emailCell.textContent = member.email || "—";

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "member-row-actions";
    const editButton = document.createElement("button");
    editButton.className = "member-row-button";
    editButton.type = "button";
    editButton.dataset.memberAction = "edit";
    editButton.dataset.memberId = member.id;
    editButton.setAttribute("aria-label", `Edit ${member.name}`);
    editButton.title = "Edit member";
    editButton.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
    const deleteButton = document.createElement("button");
    deleteButton.className = "member-row-button delete-member-button";
    deleteButton.type = "button";
    deleteButton.dataset.memberAction = "delete";
    deleteButton.dataset.memberId = member.id;
    deleteButton.setAttribute("aria-label", `Delete ${member.name}`);
    deleteButton.title = "Delete member";
    deleteButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    actions.append(editButton, deleteButton);
    actionsCell.append(actions);

    row.append(identityCell, roleCell, phoneCell, emailCell, actionsCell);
    tableBody.append(row);
  });
}

function createField(field) {
  const label = document.createElement("label");
  const id = `action-${field.name}`;
  label.htmlFor = id;
  label.textContent = field.label;
  modalFields.append(label);

  const control = field.options ? document.createElement("select") : document.createElement("input");
  control.id = id;
  control.name = field.name;
  control.required = field.required !== false;

  if (field.options) {
    field.options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      control.append(optionElement);
    });
    if (field.value !== undefined) control.value = field.value;
  } else {
    control.type = field.type || "text";
    if (field.placeholder) control.placeholder = field.placeholder;
    if (field.min !== undefined) control.min = field.min;
    if (field.step !== undefined) control.step = field.step;
    if (field.value !== undefined) control.value = field.value;
  }

  modalFields.append(control);
}

const actionForms = {
  "Manage Members": {
    title: "Add Chama Member",
    description: "Enter the new member's details below.",
    success: "Member added successfully.",
    fields: [
      { name: "name", label: "Full name", placeholder: "Enter full name" },
      { name: "phone", label: "Phone number", type: "tel", placeholder: "Enter phone number" },
      { name: "email", label: "Email address (optional)", type: "email", required: false, placeholder: "Enter email address" },
      {
        name: "role",
        label: "Member role",
        options: ["Member", "Chairperson", "Treasurer", "Secretary"].map((role) => ({ value: role, label: role }))
      }
    ]
  },
  "Record Contribution": {
    title: "Record Contribution",
    description: "Record a member's contribution to the chama.",
    success: "Contribution recorded successfully.",
    fields: [
      { name: "member", label: "Member name", placeholder: "Enter member name" },
      { name: "amount", label: "Amount (KES)", type: "number", min: "0.01", step: "0.01" }
    ]
  },
  "Manage Loans": {
    title: "Issue a Loan",
    description: "Record a loan issued from the chama balance.",
    success: "Loan recorded successfully.",
    fields: [
      { name: "borrower", label: "Borrower name", placeholder: "Enter member name" },
      { name: "amount", label: "Loan amount (KES)", type: "number", min: "0.01", step: "0.01" },
      { name: "dueDate", label: "Repayment due date", type: "date" }
    ]
  },
  "Record Transaction": {
    title: "Record Transaction",
    description: "Add an income or expense to the chama records.",
    success: "Transaction recorded successfully.",
    fields: [
      { name: "description", label: "Description", placeholder: "What is this transaction for?" },
      {
        name: "type",
        label: "Transaction type",
        options: [
          { value: "income", label: "Income" },
          { value: "expense", label: "Expense" }
        ]
      },
      { name: "amount", label: "Amount (KES)", type: "number", min: "0.01", step: "0.01" }
    ]
  },
  "Chama Settings": {
    title: "Chama Settings",
    description: "Update the chama and administrator details shown on the dashboard.",
    success: "Settings saved successfully.",
    fields: [
      { name: "chamaName", label: "Chama name", value: data.settings.chamaName },
      { name: "adminName", label: "Administrator name", value: data.settings.adminName },
      { name: "adminEmail", label: "Administrator email", type: "email", required: false, value: data.settings.adminEmail }
    ]
  }
};

function openForm(action, memberId = null) {
  const definition = actionForms[action];
  if (!definition) return;

  activeAction = action;
  editingMemberId = action === "Manage Members" ? memberId : null;
  const member = editingMemberId
    ? data.members.find((item) => item.id === editingMemberId)
    : null;
  modalTitle.textContent = member ? "Edit Chama Member" : definition.title;
  modalDescription.textContent = member
    ? "Update this member's contact details or role."
    : definition.description;
  form.querySelector(".save-button").textContent =
    action === "Manage Members"
      ? member ? "Save Changes" : "Save Member"
      : "Save";
  modalFields.replaceChildren();
  definition.fields.forEach((field) => {
    createField(member ? { ...field, value: member[field.name] ?? "" } : field);
  });
  modal.classList.add("open");
  modal.querySelector("input, select")?.focus();
}

function closeForm() {
  modal.classList.remove("open");
  form.reset();
  editingMemberId = null;
}

function recordTransaction(description, type, amount) {
  data.transactions.push({
    description,
    type,
    amount,
    date: new Date().toISOString()
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const amount = Number(values.amount);
  const definition = actionForms[activeAction];

  if (values.amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
    showMessage("Enter an amount greater than zero.");
    return;
  }

  switch (activeAction) {
    case "Manage Members":
      if (editingMemberId) {
        const member = data.members.find((item) => item.id === editingMemberId);
        if (!member) {
          showMessage("This member could not be found. Refresh the directory and try again.");
          closeForm();
          return;
        }
        member.name = values.name.trim();
        member.phone = values.phone.trim();
        member.email = values.email.trim();
        member.role = values.role;
      } else {
        data.members.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          role: values.role
        });
      }
      break;
    case "Record Contribution":
      data.contributions.push({ member: values.member.trim(), amount, date: new Date().toISOString() });
      recordTransaction(`Contribution — ${values.member.trim()}`, "income", amount);
      break;
    case "Manage Loans":
      data.loans.push({
        borrower: values.borrower.trim(),
        amount,
        dueDate: values.dueDate
      });
      recordTransaction(`Loan to ${values.borrower.trim()}`, "expense", amount);
      break;
    case "Record Transaction":
      recordTransaction(values.description.trim(), values.type, amount);
      break;
    case "Chama Settings":
      data.settings = {
        chamaName: values.chamaName.trim(),
        adminName: values.adminName.trim(),
        adminEmail: values.adminEmail.trim()
      };
      break;
    default:
      return;
  }

  const wasEditingMember = activeAction === "Manage Members" && editingMemberId !== null;
  saveData();
  renderDashboard();
  const activePage = document.querySelector(".nav-link.active")?.dataset.page;
  if (activePage && !["Dashboard", "Members"].includes(activePage)) {
    renderWorkspacePage(activePage);
  }
  closeForm();
  showMessage(
    wasEditingMember
      ? "Member updated successfully."
      : definition.success
  );
});

document.getElementById("closeMemberModal").addEventListener("click", closeForm);
document.getElementById("cancelMemberModal").addEventListener("click", closeForm);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeForm();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) closeForm();
});

function createWorkspaceElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderWorkspacePage(page) {
  const workspace = document.getElementById("workspacePage");
  const totalContributions = data.contributions.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = data.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = data.transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const now = new Date();
  const monthContributions = data.contributions
    .filter((contribution) => {
      const date = new Date(contribution.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  const loanTotal = data.loans.reduce((sum, loan) => sum + loan.amount, 0);
  const recentDate = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "—";
  const pages = {
    Contributions: {
      description: "Track member deposits and monitor chama savings.",
      action: "Record Contribution",
      actionLabel: "Record contribution",
      stats: [
        ["Total contributions", formatCurrency(totalContributions), "fa-coins"],
        ["This month", formatCurrency(monthContributions), "fa-calendar-days"],
        ["Contribution records", String(data.contributions.length), "fa-list-check"]
      ],
      heading: "Contribution history",
      columns: ["Member", "Amount", "Date"],
      rows: [...data.contributions].reverse().map((item) => [
        item.member, formatCurrency(item.amount), recentDate(item.date)
      ]),
      empty: "No contributions recorded yet."
    },
    Loans: {
      description: "Review loans issued to members and their repayment dates.",
      action: "Manage Loans",
      actionLabel: "Record a loan",
      stats: [
        ["Loans issued", formatCurrency(loanTotal), "fa-landmark"],
        ["Loans recorded", String(data.loans.length), "fa-file-invoice-dollar"],
        ["Average loan", formatCurrency(data.loans.length ? loanTotal / data.loans.length : 0), "fa-chart-line"]
      ],
      heading: "Loan register",
      columns: ["Borrower", "Amount", "Due date"],
      rows: [...data.loans].reverse().map((item) => [
        item.borrower, formatCurrency(item.amount), recentDate(item.dueDate)
      ]),
      empty: "No loans have been recorded yet."
    },
    Transactions: {
      description: "Keep an eye on chama income, expenses and available funds.",
      action: "Record Transaction",
      actionLabel: "Record transaction",
      stats: [
        ["Total income", formatCurrency(totalIncome), "fa-arrow-trend-up"],
        ["Total expenses", formatCurrency(totalExpenses), "fa-arrow-trend-down"],
        ["Available balance", formatCurrency(currentBalance()), "fa-wallet"]
      ],
      heading: "Transaction history",
      columns: ["Description", "Type", "Amount", "Date"],
      filterColumn: 1,
      rows: [...data.transactions].reverse().map((item) => [
        item.description, item.type === "income" ? "Income" : "Expense",
        formatCurrency(item.amount), recentDate(item.date)
      ]),
      empty: "No transactions recorded yet."
    },
    Reports: {
      description: "A clear overview of your chama's financial position.",
      stats: [
        ["Total members", String(data.members.length), "fa-users"],
        ["Total contributions", formatCurrency(totalContributions), "fa-coins"],
        ["Available balance", formatCurrency(currentBalance()), "fa-wallet"]
      ],
      heading: "Financial summary",
      columns: ["Measure", "Amount / total"],
      rows: [
        ["Members", String(data.members.length)],
        ["Contributions", formatCurrency(totalContributions)],
        ["Other income", formatCurrency(totalIncome - totalContributions)],
        ["Expenses", formatCurrency(totalExpenses)],
        ["Loans issued", formatCurrency(loanTotal)],
        ["Available balance", formatCurrency(currentBalance())]
      ],
      empty: "Record chama activity to start building your report."
    },
    Settings: {
      description: "Review the chama profile and administrator details.",
      action: "Chama Settings",
      actionLabel: "Edit settings",
      stats: [
        ["Chama members", String(data.members.length), "fa-users"],
        ["Administrator", data.settings.adminName, "fa-user-tie"],
        ["Currency", "KES", "fa-coins"]
      ],
      heading: "Chama profile",
      columns: ["Setting", "Current value"],
      rows: [
        ["Chama name", data.settings.chamaName],
        ["Administrator", data.settings.adminName],
        ["Administrator email", data.settings.adminEmail || "Not provided"]
      ],
      empty: "No settings available."
    }
  };
  const definition = pages[page];
  if (!definition) return;

  workspace.replaceChildren();
  workspace.setAttribute("aria-labelledby", "workspacePageTitle");
  const pageIcons = {
    Contributions: "fa-coins",
    Loans: "fa-landmark",
    Transactions: "fa-arrow-right-arrow-left",
    Reports: "fa-chart-pie",
    Settings: "fa-gear"
  };
  const heading = createWorkspaceElement("section", "workspace-page-heading");
  const headingCopy = createWorkspaceElement("div");
  const pageIcon = createWorkspaceElement("span", "workspace-page-icon");
  pageIcon.append(createWorkspaceElement("i", `fa-solid ${pageIcons[page]}`));
  headingCopy.append(
    createWorkspaceElement("p", "members-eyebrow", "Chama workspace / overview"),
    createWorkspaceElement("h1", "", page),
    createWorkspaceElement("p", "", definition.description)
  );
  headingCopy.querySelector("h1").id = "workspacePageTitle";
  heading.append(pageIcon, headingCopy);
  if (definition.action) {
    const actionButton = createWorkspaceElement("button", "members-add-button");
    actionButton.type = "button";
    actionButton.append(
      createWorkspaceElement("i", "fa-solid fa-plus"),
      document.createTextNode(` ${definition.actionLabel}`)
    );
    actionButton.addEventListener("click", () => openForm(definition.action));
    heading.append(actionButton);
  }
  workspace.append(heading);

  const statGrid = createWorkspaceElement("section", "member-stat-grid");
  statGrid.setAttribute("aria-label", `${page} summary`);
  definition.stats.forEach(([label, value, icon], index) => {
    const card = createWorkspaceElement("article", "member-stat-card");
    const iconElement = createWorkspaceElement(
      "span",
      `member-stat-icon ${["member-stat-blue", "member-stat-purple", "member-stat-green"][index]}`
    );
    iconElement.append(createWorkspaceElement("i", `fa-solid ${icon}`));
    const copy = createWorkspaceElement("div");
    copy.append(createWorkspaceElement("span", "", label), createWorkspaceElement("strong", "", value));
    card.append(iconElement, copy);
    statGrid.append(card);
  });
  workspace.append(statGrid);

  if (page === "Reports") {
    const chartSection = createWorkspaceElement("section", "report-chart-panel");
    const chartHeading = createWorkspaceElement("div", "report-chart-heading");
    chartHeading.append(
    createWorkspaceElement("div", "", ""),
    createWorkspaceElement("span", "report-chart-period", "All-time overview")
    );
    chartHeading.firstElementChild.append(
    createWorkspaceElement("h2", "", "Money movement"),
    createWorkspaceElement("p", "", "Compare contributions, income, expenses and loans.")
    );
    chartSection.append(chartHeading);
    const chart = createWorkspaceElement("div", "report-chart");
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", "Bar chart comparing contributions, other income, expenses and loans issued");
    const chartValues = [
    ["Contributions", totalContributions, "chart-bar-blue"],
    ["Other income", Math.max(0, totalIncome - totalContributions), "chart-bar-green"],
    ["Expenses", totalExpenses, "chart-bar-orange"],
    ["Loans issued", loanTotal, "chart-bar-purple"]
    ];
    const chartMax = Math.max(...chartValues.map(([, value]) => value), 1);
    chartValues.forEach(([label, value, colorClass]) => {
    const column = createWorkspaceElement("div", "report-chart-column");
    const amount = createWorkspaceElement("strong", "report-chart-value", formatCurrency(value));
    const barTrack = createWorkspaceElement("div", "report-chart-track");
    const bar = createWorkspaceElement("span", `report-chart-bar ${colorClass}`);
    const height = value ? Math.max(5, (value / chartMax) * 100) : 0;
    bar.style.height = `${height}%`;
    bar.title = `${label}: ${formatCurrency(value)}`;
    barTrack.append(bar);
    column.append(amount, barTrack, createWorkspaceElement("span", "report-chart-label", label));
    chart.append(column);
    });
    chartSection.append(chart);
    workspace.append(chartSection);
  }

  const panel = createWorkspaceElement("section", "members-list-panel");
  const panelHeading = createWorkspaceElement("div", "members-list-heading");
  const panelTitle = createWorkspaceElement("div");
  panelTitle.append(
    createWorkspaceElement("h2", "", definition.heading),
    createWorkspaceElement(
    "p",
    "workspace-result-count",
    `${definition.rows.length} ${definition.rows.length === 1 ? "record" : "records"}`
    )
  );
  panelHeading.append(panelTitle);
  panel.append(panelHeading);
  const toolbar = createWorkspaceElement("div", "workspace-toolbar");
  const searchLabel = createWorkspaceElement("label", "workspace-search");
  searchLabel.append(
    createWorkspaceElement("i", "fa-solid fa-magnifying-glass"),
    createWorkspaceElement("span", "visually-hidden", `Search ${page.toLocaleLowerCase()}`)
  );
  const searchInput = createWorkspaceElement("input");
  searchInput.type = "search";
  searchInput.placeholder = `Search ${page.toLocaleLowerCase()}...`;
  searchLabel.append(searchInput);
  toolbar.append(searchLabel);
  if (definition.filterColumn !== undefined) {
    const filterLabel = createWorkspaceElement("label", "workspace-filter");
    filterLabel.append(createWorkspaceElement("span", "visually-hidden", "Filter transactions by type"));
    const filter = createWorkspaceElement("select");
    [["all", "All types"], ["Income", "Income"], ["Expense", "Expenses"]].forEach(([value, label]) => {
    const option = createWorkspaceElement("option", "", label);
    option.value = value;
    filter.append(option);
    });
    filterLabel.append(filter);
    toolbar.append(filterLabel);
  }
  panel.append(toolbar);
  if (definition.rows.length) {
    const tableWrap = createWorkspaceElement("div", "members-table-wrap");
    const table = createWorkspaceElement("table", "members-table");
    table.classList.add("workspace-table");
    const tableHead = createWorkspaceElement("thead");
    const headerRow = createWorkspaceElement("tr");
    definition.columns.forEach((column) => {
      const cell = createWorkspaceElement("th", "", column);
      cell.scope = "col";
      headerRow.append(cell);
    });
    tableHead.append(headerRow);
    const body = createWorkspaceElement("tbody");
    definition.rows.forEach((row) => {
      const tableRow = createWorkspaceElement("tr");
      if (definition.filterColumn !== undefined) {
        tableRow.dataset.category = row[definition.filterColumn].toLocaleLowerCase();
      }
      row.forEach((value, index) => {
        const cell = createWorkspaceElement("td");
        if (definition.filterColumn !== undefined && index === definition.filterColumn) {
          const badge = createWorkspaceElement(
            "span",
            `workspace-type-badge ${value === "Income" ? "is-income" : "is-expense"}`,
            value
          );
          cell.append(badge);
        } else {
          cell.textContent = value;
        }
        if (definition.filterColumn !== undefined && index === 2) {
          cell.classList.add(row[definition.filterColumn] === "Income" ? "amount-positive" : "amount-negative");
        }
        tableRow.append(cell);
      });
      body.append(tableRow);
    });
    table.append(tableHead, body);
    tableWrap.append(table);
    panel.append(tableWrap);
    const emptyState = createWorkspaceElement("div", "workspace-filter-empty");
    emptyState.hidden = true;
    emptyState.append(
      createWorkspaceElement("span", "members-empty-icon"),
      createWorkspaceElement("strong", "", "No matching records"),
      createWorkspaceElement("p", "", "Try changing your search or selected filter.")
    );
    emptyState.firstElementChild.append(createWorkspaceElement("i", "fa-solid fa-filter-circle-xmark"));
    panel.append(emptyState);
    const updateRows = () => {
      const query = searchInput.value.trim().toLocaleLowerCase();
      const selectedCategory = toolbar.querySelector("select")?.value || "all";
      let visibleRows = 0;
      body.querySelectorAll("tr").forEach((row) => {
        const matchesQuery = row.textContent.toLocaleLowerCase().includes(query);
        const matchesCategory = selectedCategory === "all" || row.dataset.category === selectedCategory.toLocaleLowerCase();
        row.hidden = !matchesQuery || !matchesCategory;
        if (!row.hidden) visibleRows += 1;
      });
      panel.querySelector(".workspace-result-count").textContent =
        `${visibleRows} ${visibleRows === 1 ? "record" : "records"}`;
      emptyState.hidden = visibleRows > 0;
      tableWrap.hidden = visibleRows === 0;
    };
    searchInput.addEventListener("input", updateRows);
    toolbar.querySelector("select")?.addEventListener("change", updateRows);
  } else {
    toolbar.hidden = true;
    const emptyState = createWorkspaceElement("div", "members-empty-state");
    emptyState.append(
      createWorkspaceElement("span", "members-empty-icon"),
      createWorkspaceElement("strong", "", definition.empty),
      createWorkspaceElement("p", "", definition.action
        ? `Use “${definition.actionLabel}” to add your first record.`
        : "Your summary will appear here once you have recorded chama activity.")
    );
    emptyState.firstElementChild.append(createWorkspaceElement("i", "fa-solid fa-inbox"));
    panel.append(emptyState);
  }
  workspace.append(panel);
}

function activatePage(page) {
  document.querySelectorAll(".nav-link").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page);
    if (item.dataset.page === page) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  const dashboardHome = document.getElementById("dashboardHome");
  const membersPage = document.getElementById("membersPage");
  const workspacePage = document.getElementById("workspacePage");

  if (page === "Members") {
    dashboardHome.hidden = true;
    membersPage.hidden = false;
    workspacePage.hidden = true;
    renderMembers();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  membersPage.hidden = true;
  if (page === "Dashboard") {
    workspacePage.hidden = true;
    dashboardHome.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  dashboardHome.hidden = true;
  workspacePage.hidden = false;
  renderWorkspacePage(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    activatePage(link.dataset.page);
  });
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  activatePage("Dashboard");
});

document.querySelectorAll(".action-card").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "Manage Members") {
      activatePage("Members");
    } else if (action === "View Reports") {
      activatePage("Reports");
    } else {
      openForm(action);
    }
  });
});

document.getElementById("addMemberButton").addEventListener("click", () => {
  openForm("Manage Members");
});
document.getElementById("emptyAddMemberButton").addEventListener("click", () => {
  openForm("Manage Members");
});
document.getElementById("memberSearch").addEventListener("input", renderMembers);
document.getElementById("memberRoleFilter").addEventListener("change", renderMembers);
document.getElementById("membersTableBody").addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-member-action]");
  if (!button) return;

  const member = data.members.find((item) => item.id === button.dataset.memberId);
  if (!member) return;

  if (button.dataset.memberAction === "edit") {
    openForm("Manage Members", member.id);
  } else if (button.dataset.memberAction === "delete") {
    if (!window.confirm(`Remove ${member.name} from the member directory?`)) return;

    data.members = data.members.filter((item) => item.id !== member.id);
    saveData();
    renderDashboard();
    showMessage(`${member.name} was removed from the member directory.`);
  }
});

const searchInput = document.getElementById("globalSearch");
searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const query = searchInput.value.trim().toLocaleLowerCase();
  if (!query) {
    showMessage("Type a name or transaction description to search.");
    return;
  }

  const matchingMembers = data.members.filter((member) =>
    `${member.name} ${member.phone} ${member.email}`.toLocaleLowerCase().includes(query)
  ).length;
  const matchingTransactions = data.transactions.filter((transaction) =>
    transaction.description.toLocaleLowerCase().includes(query)
  ).length;
  showMessage(`Found ${matchingMembers + matchingTransactions} matching records.`);
});

document.getElementById("notificationButton").addEventListener("click", () => {
  const latest = data.transactions[data.transactions.length - 1];
  showMessage(latest ? `Latest activity: ${latest.description}.` : "You're all caught up! No new notifications.");
});

document.getElementById("profileButton").addEventListener("click", () => {
  openForm("Chama Settings");
});

document.getElementById("viewActions").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector(".quick-actions-section").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-page-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const page = link.dataset.pageLink;
    activatePage(page);
    if (page === "Transactions") {
      document.getElementById("workspacePage").scrollIntoView({ behavior: "smooth" });
    }
  });
});

renderDashboard();

const appLoader = document.getElementById("appLoader");
window.setTimeout(() => {
  appLoader.classList.add("is-hidden");
  appLoader.setAttribute("aria-hidden", "true");
}, 4000);
