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
  pendingMpesaPayments: [],
  settings: {
    chamaName: "Akiba Chama Management",
    adminName: "Chama Admin",
    adminEmail: "",
    contributionDueDay: 5
  }
};
const data = { ...emptyData, settings: { ...emptyData.settings } };
let activeChamaId = "";
let currentRole = "";
let saveQueue = Promise.resolve();
const paymentWatches = new Set();
const backupFormat = "akiba-chama-backup";
const backupVersion = 1;
const maxBackupBytes = 5 * 1024 * 1024;

function showMessage(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function saveData() {
  saveQueue = saveQueue.then(async () => {
    if (!activeChamaId) return false;
    const response = await fetch(`/api/chamas/${encodeURIComponent(activeChamaId)}/data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: JSON.parse(JSON.stringify(data)) })
    });
    const result = await response.json();
    if (response.status === 202) {
      Object.assign(data, result.data);
      renderDashboard();
      refreshActiveWorkspace();
      showMessage("This financial operation needs chairperson approval before it is recorded.");
      return false;
    }
    if (!response.ok) {
      showMessage(result.error || "Akiba could not save these chama records.");
      return false;
    }
    return true;
  }).catch((error) => {
    showMessage(error.message || "Akiba could not save these chama records.");
    return false;
  });
  return saveQueue;
}

async function loadChamaData(preferredChamaId = "") {
  const listResponse = await fetch("/api/chamas", { cache: "no-store" });
  const listResult = await listResponse.json();
  if (!listResponse.ok) throw new Error(listResult.error || "Could not load your chama list.");
  const chamas = Array.isArray(listResult.chamas) ? listResult.chamas : [];
  if (!chamas.length) throw new Error("Your account is not assigned to a chama yet.");

  const rememberedId = preferredChamaId || localStorage.getItem("akibaActiveChamaId");
  activeChamaId = chamas.some((chama) => chama.id === rememberedId)
    ? rememberedId
    : chamas[0].id;
  const switcher = document.getElementById("chamaSwitcher");
  switcher.replaceChildren(...chamas.map((chama) => {
    const option = document.createElement("option");
    option.value = chama.id;
    option.textContent = chama.name;
    return option;
  }));
  switcher.value = activeChamaId;
  localStorage.setItem("akibaActiveChamaId", activeChamaId);

  const response = await fetch(`/api/chamas/${encodeURIComponent(activeChamaId)}/data`, {
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not load this chama's records.");
  Object.assign(data, emptyData, result.data, {
    settings: { ...emptyData.settings, ...result.data.settings },
    pendingMpesaPayments: Array.isArray(result.data.pendingMpesaPayments)
      ? result.data.pendingMpesaPayments
      : []
  });
  currentRole = result.role;
  applyRolePermissions();
}

function applyRolePermissions() {
  const canManageMembers = ["chairperson", "secretary", "platform_admin"].includes(currentRole);
  const canManageFinances = ["chairperson", "treasurer", "platform_admin"].includes(currentRole);
  const canManageSettings = ["chairperson", "platform_admin"].includes(currentRole);
  document.querySelectorAll(".action-card").forEach((button) => {
    const action = button.dataset.action;
    button.hidden = action === "Manage Members" ? !canManageMembers
      : ["Record Contribution", "Manage Loans", "Record Transaction"].includes(action)
        ? !canManageFinances
        : action === "Chama Settings" && !canManageSettings;
  });
  document.getElementById("addMemberButton").hidden = !canManageMembers;
  document.getElementById("emptyAddMemberButton").hidden = !canManageMembers;
  document.getElementById("profileButton").disabled = !canManageSettings;
  document.body.dataset.role = currentRole;
  document.getElementById("chamaAccessPanel").hidden = !["chairperson", "platform_admin"].includes(currentRole);
  const approvalsLink = document.querySelector('.nav-link[data-page="Approvals"]');
  approvalsLink.hidden = !["chairperson", "treasurer", "platform_admin"].includes(currentRole);
}

async function loadChamaMembers() {
  const panel = document.getElementById("chamaAccessPanel");
  if (!activeChamaId || panel.hidden) return;
  const response = await fetch(`/api/chamas/${encodeURIComponent(activeChamaId)}/members`, {
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) {
    showMessage(result.error || "Could not load chama access roles.");
    return;
  }

  panel.replaceChildren();
  const heading = document.createElement("div");
  heading.className = "members-list-heading";
  const headingCopy = document.createElement("div");
  const title = document.createElement("h2");
  title.id = "chamaAccessTitle";
  title.textContent = "Chama access and roles";
  const description = document.createElement("p");
  description.textContent = "Only assigned accounts can open this chama's records.";
  headingCopy.append(title, description);
  heading.append(headingCopy);
  panel.append(heading);

  const form = document.createElement("form");
  form.className = "chama-access-form";
  const email = document.createElement("input");
  email.type = "email";
  email.required = true;
  email.maxLength = 254;
  email.placeholder = "Existing Akiba account email";
  email.setAttribute("aria-label", "Existing Akiba account email");
  const roleSelect = createRoleSelect("ordinary_member");
  roleSelect.setAttribute("aria-label", "Chama role for new account");
  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.className = "members-add-button";
  addButton.innerHTML = '<i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>Add account</span>';
  form.append(email, roleSelect, addButton);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const addResponse = await fetch(`/api/chamas/${encodeURIComponent(activeChamaId)}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value.trim(), role: roleSelect.value })
    });
    const addResult = await addResponse.json();
    if (!addResponse.ok) {
      showMessage(addResult.error || "Could not add this account.");
      return;
    }
    showMessage(addResult.message);
    await loadChamaMembers();
  });
  panel.append(form);

  const list = document.createElement("div");
  list.className = "chama-access-list";
  result.members.forEach((member) => {
    const row = document.createElement("div");
    row.className = "chama-access-row";
    const identity = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = member.name;
    const accountEmail = document.createElement("small");
    accountEmail.textContent = member.email || "Account email hidden";
    identity.append(name, accountEmail);
    const select = createRoleSelect(member.role);
    select.setAttribute("aria-label", `Role for ${member.name}`);
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "member-row-button";
    saveButton.title = `Save role for ${member.name}`;
    saveButton.setAttribute("aria-label", `Save role for ${member.name}`);
    saveButton.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
    saveButton.addEventListener("click", async () => {
      const saveResponse = await fetch(
        `/api/chamas/${encodeURIComponent(activeChamaId)}/members/${encodeURIComponent(member.id)}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: select.value })
        }
      );
      const saveResult = await saveResponse.json();
      showMessage(saveResponse.ok ? saveResult.message : saveResult.error || "Could not update this role.");
      if (saveResponse.ok) await loadChamaMembers();
    });
    row.append(identity, select, saveButton);
    list.append(row);
  });
  panel.append(list);
}

function createRoleSelect(selectedRole) {
  const select = document.createElement("select");
  [
    ["chairperson", "Chairperson"],
    ["treasurer", "Treasurer"],
    ["secretary", "Secretary"],
    ["ordinary_member", "Ordinary member"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
  select.value = selectedRole;
  return select;
}

function createBackup() {
  return {
    format: backupFormat,
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    data: {
      members: data.members,
      contributions: data.contributions,
      loans: data.loans,
      transactions: data.transactions,
      pendingMpesaPayments: data.pendingMpesaPayments,
      settings: data.settings
    }
  };
}

function validateBackup(backup) {
  if (
    !backup ||
    typeof backup !== "object" ||
    backup.format !== backupFormat ||
    backup.version !== backupVersion ||
    !backup.data ||
    typeof backup.data !== "object"
  ) return null;

  const source = backup.data;
  const isText = (value, maxLength) =>
    typeof value === "string" && value.length > 0 && value.length <= maxLength;
  const isOptionalText = (value, maxLength) =>
    value === undefined || value === "" || (typeof value === "string" && value.length <= maxLength);
  const isAmount = (value) => Number.isFinite(value) && value > 0;
  const isDate = (value) => isText(value, 64) && Number.isFinite(Date.parse(value));
  const isList = (value) => Array.isArray(value) && value.length <= 10000;

  if (
    !isList(source.members) ||
    !isList(source.contributions) ||
    !isList(source.loans) ||
    !isList(source.transactions) ||
    !isList(source.pendingMpesaPayments) ||
    !source.settings ||
    typeof source.settings !== "object" ||
    !isText(source.settings.chamaName, 100) ||
    !isText(source.settings.adminName, 80) ||
    !isOptionalText(source.settings.adminEmail, 254)
  ) return null;

  const members = source.members.map((member) => {
    if (
      !member || typeof member !== "object" ||
      !isText(member.id, 100) ||
      !isText(member.name, 80) ||
      !isOptionalText(member.phone, 50) ||
      !isOptionalText(member.email, 254) ||
      !isOptionalText(member.role, 80) ||
      !(member.monthlyPledge === undefined ||
        (Number.isInteger(member.monthlyPledge) && member.monthlyPledge >= 0 && member.monthlyPledge <= 150000))
    ) return null;
    return {
      id: member.id,
      name: member.name,
      phone: member.phone || "",
      email: member.email || "",
      role: member.role || "",
      monthlyPledge: member.monthlyPledge || 0
    };
  });
  const contributions = source.contributions.map((contribution) => {
    if (
      !contribution || typeof contribution !== "object" ||
      !isText(contribution.member, 80) ||
      !isAmount(contribution.amount) ||
      !isDate(contribution.date) ||
      !isOptionalText(contribution.paymentMethod, 40) ||
      !isOptionalText(contribution.receiptNumber, 64) ||
      !isOptionalText(contribution.checkoutRequestId, 128) ||
      !isOptionalText(contribution.memberId, 100)
    ) return null;
    return {
      member: contribution.member,
      amount: contribution.amount,
      date: contribution.date,
      ...(contribution.memberId ? { memberId: contribution.memberId } : {}),
      ...(contribution.paymentMethod ? { paymentMethod: contribution.paymentMethod } : {}),
      ...(contribution.receiptNumber ? { receiptNumber: contribution.receiptNumber } : {}),
      ...(contribution.checkoutRequestId ? { checkoutRequestId: contribution.checkoutRequestId } : {})
    };
  });
  const loans = source.loans.map((loan) => {
    if (
      !loan || typeof loan !== "object" ||
      !isText(loan.borrower, 80) ||
      !isAmount(loan.amount) ||
      !isDate(loan.dueDate)
    ) return null;
    return { borrower: loan.borrower, amount: loan.amount, dueDate: loan.dueDate };
  });
  const transactions = source.transactions.map((transaction) => {
    if (
      !transaction || typeof transaction !== "object" ||
      !isText(transaction.description, 200) ||
      !["income", "expense"].includes(transaction.type) ||
      !isAmount(transaction.amount) ||
      !isDate(transaction.date)
    ) return null;
    return {
      description: transaction.description,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date
    };
  });
  const pendingMpesaPayments = source.pendingMpesaPayments.map((payment) => {
    if (
      !payment || typeof payment !== "object" ||
      !isText(payment.checkoutRequestId, 128) ||
      !isText(payment.member, 80) ||
      !Number.isInteger(payment.amount) ||
      payment.amount < 1 ||
      !isDate(payment.startedAt) ||
      !isOptionalText(payment.memberId, 100)
    ) return null;
    return {
      checkoutRequestId: payment.checkoutRequestId,
      member: payment.member,
      amount: payment.amount,
      startedAt: payment.startedAt,
      ...(payment.memberId ? { memberId: payment.memberId } : {})
    };
  });

  if (
    [...members, ...contributions, ...loans, ...transactions, ...pendingMpesaPayments]
      .some((item) => item === null)
  ) return null;

  return {
    members,
    contributions,
    loans,
    transactions,
    pendingMpesaPayments,
    settings: {
      chamaName: source.settings.chamaName,
      adminName: source.settings.adminName,
      adminEmail: source.settings.adminEmail || "",
      contributionDueDay: Number.isInteger(source.settings.contributionDueDay) &&
        source.settings.contributionDueDay >= 1 &&
        source.settings.contributionDueDay <= 28
        ? source.settings.contributionDueDay
        : 5
    }
  };
}

function downloadBackup() {
  const backup = new Blob([JSON.stringify(createBackup(), null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(backup);
  const downloadLink = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  downloadLink.href = url;
  downloadLink.download = `akiba-backup-${date}.json`;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showMessage("Backup downloaded. Store it somewhere private and secure.");
}

async function restoreBackup(file) {
  if (file.size === 0 || file.size > maxBackupBytes) {
    showMessage("Choose a non-empty backup file smaller than 5 MB.");
    return;
  }

  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    showMessage("This file is not valid JSON. Choose an Akiba backup file.");
    return;
  }

  const restoredData = validateBackup(backup);
  if (!restoredData) {
    showMessage("This file is not a valid or supported Akiba backup.");
    return;
  }
  if (!window.confirm("Restore this backup? It will replace the records saved for this chama.")) {
    return;
  }

  const currentData = JSON.parse(JSON.stringify(data));
  Object.assign(data, restoredData);
  if (!(await saveData())) {
    Object.assign(data, currentData);
    renderDashboard();
    refreshActiveWorkspace();
    return;
  }
  renderDashboard();
  refreshActiveWorkspace();
  data.pendingMpesaPayments.forEach((payment) => {
    if (payment?.checkoutRequestId) void monitorMpesaPayment(payment);
  });
  showMessage("Backup restored successfully.");
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

function getMonthlyContributionStatus(member, now = new Date()) {
  const pledge = Number(member.monthlyPledge) || 0;
  const received = data.contributions
    .filter((contribution) => {
      const date = new Date(contribution.date);
      const sameMember = contribution.memberId
        ? contribution.memberId === member.id
        : contribution.member === member.name;
      return sameMember &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth();
    })
    .reduce((total, contribution) => total + contribution.amount, 0);
  const outstanding = Math.max(0, pledge - received);
  const dueDay = data.settings.contributionDueDay || 5;
  const isOverdue = pledge > 0 && outstanding > 0 && now.getDate() > dueDay;
  const status = pledge <= 0
    ? "Pledge not set"
    : outstanding <= 0
      ? "Paid"
      : received > 0
        ? isOverdue ? "Partially overdue" : "Partially paid"
        : isOverdue ? "Overdue" : "Due";

  return { pledge, received, outstanding, dueDay, isOverdue, status };
}

function contributionMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(date);
}

function formatDueDay(day) {
  const suffix = day % 100 >= 11 && day % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  return `${day}${suffix}`;
}

function normalizeKenyanWhatsAppNumber(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) digits = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  return /^254[17]\d{8}$/.test(digits) ? digits : null;
}

function openContributionReminder(member, status, month) {
  const phone = normalizeKenyanWhatsAppNumber(member.phone);
  if (!phone) {
    showMessage(`Add a valid Kenyan phone number for ${member.name} before sending a reminder.`);
    return;
  }
  const dueDay = formatDueDay(status.dueDay);
  const message = status.received > 0
    ? `Hello ${member.name}, this is a friendly reminder that your ${month} chama contribution has a remaining balance of ${formatCurrency(status.outstanding)}. Please contribute by the ${dueDay} of the month. Thank you.`
    : `Hello ${member.name}, this is a friendly reminder to make your ${month} chama contribution of ${formatCurrency(status.pledge)} by the ${dueDay} of the month. Thank you.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

function createReceiptNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AKB-${date}-${suffix}`;
}

function openContributionReceipt(contribution) {
  if (!contribution.receiptNumber) {
    contribution.receiptNumber = createReceiptNumber();
    saveData();
  }

  const receiptWindow = window.open("", "_blank");
  if (!receiptWindow) {
    showMessage("Allow pop-ups to view or print this receipt.");
    return;
  }
  receiptWindow.opener = null;
  const receiptDocument = receiptWindow.document;
  receiptDocument.title = `Akiba receipt ${contribution.receiptNumber}`;

  const styles = receiptDocument.createElement("style");
  styles.textContent = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 36px; background: #f1f5f9; color: #0f172a; font: 14px/1.55 Arial, sans-serif; }
    .receipt { width: min(100%, 680px); margin: 0 auto; padding: 42px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; }
    .receipt-brand { color: #0f766e; font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 12px 0 4px; font-size: 27px; }
    .receipt-subtitle { margin: 0; color: #64748b; }
    .receipt-status { display: inline-block; margin: 24px 0; padding: 6px 11px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; }
    .receipt-amount { margin: 0 0 24px; color: #0f172a; font-size: 32px; font-weight: 800; }
    dl { margin: 0; border-top: 1px solid #e2e8f0; }
    .receipt-row { display: flex; justify-content: space-between; gap: 20px; padding: 13px 0; border-bottom: 1px solid #e2e8f0; }
    dt { color: #64748b; } dd { margin: 0; text-align: right; font-weight: 650; overflow-wrap: anywhere; }
    .receipt-foot { margin: 24px 0 0; color: #64748b; font-size: 11px; text-align: center; }
    .receipt-print { display: block; margin: 24px auto 0; padding: 10px 18px; border: 0; border-radius: 8px; background: #059669; color: #fff; font-weight: 700; cursor: pointer; }
    @media print { body { padding: 0; background: #fff; } .receipt { border: 0; padding: 15px; } .receipt-print { display: none; } }
  `;
  const receipt = receiptDocument.createElement("main");
  receipt.className = "receipt";
  const addText = (tag, className, text) => {
    const element = receiptDocument.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  };
  receipt.append(
    addText("div", "receipt-brand", "Akiba · Chama"),
    addText("h1", "", "Contribution receipt"),
    addText("p", "receipt-subtitle", data.settings.chamaName),
    addText("span", "receipt-status", "PAYMENT RECORDED"),
    addText("p", "receipt-amount", formatCurrency(contribution.amount))
  );

  const details = receiptDocument.createElement("dl");
  const rows = [
    ["Received from", contribution.member],
    ["Receipt number", contribution.receiptNumber],
    ["Payment method", contribution.paymentMethod || "Cash / other"],
    ["Date", new Date(contribution.date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short"
    })]
  ];
  rows.forEach(([label, value]) => {
    const row = receiptDocument.createElement("div");
    row.className = "receipt-row";
    const term = receiptDocument.createElement("dt");
    term.textContent = label;
    const description = receiptDocument.createElement("dd");
    description.textContent = value;
    row.append(term, description);
    details.append(row);
  });
  receipt.append(details);
  if (contribution.paymentMethod === "M-Pesa") {
    const note = addText("p", "receipt-foot", "M-Pesa payment confirmed. Keep this receipt for your records.");
    receipt.append(note);
  } else {
    receipt.append(addText("p", "receipt-foot", "Keep this receipt for your records."));
  }
  const printButton = addText("button", "receipt-print", "Print or save as PDF");
  printButton.type = "button";
  printButton.addEventListener("click", () => receiptWindow.print());
  receipt.append(printButton);
  receiptDocument.head.replaceChildren(styles);
  receiptDocument.body.replaceChildren(receipt);
}

function renderContributionReminders(container, now = new Date()) {
  const month = contributionMonthLabel(now);
  const panel = createWorkspaceElement("section", "contribution-reminders-panel");
  panel.setAttribute("aria-labelledby", "contributionRemindersTitle");
  const heading = createWorkspaceElement("div", "contribution-reminders-heading");
  const copy = createWorkspaceElement("div");
  copy.append(
    createWorkspaceElement("h2", "", "Monthly contribution reminders"),
    createWorkspaceElement(
      "p",
      "",
      `${month} · contributions are due by the ${formatDueDay(data.settings.contributionDueDay)}. Reminders open as a WhatsApp draft; you choose whether to send.`
    )
  );
  copy.querySelector("h2").id = "contributionRemindersTitle";
  const summary = data.members.reduce((counts, member) => {
    const status = getMonthlyContributionStatus(member, now);
    if (status.pledge > 0 && status.outstanding > 0) {
      counts.outstanding += 1;
      if (status.isOverdue) counts.overdue += 1;
    }
    return counts;
  }, { outstanding: 0, overdue: 0 });
  const badge = createWorkspaceElement(
    "span",
    summary.overdue ? "contribution-reminder-count is-overdue" : "contribution-reminder-count",
    `${summary.overdue} overdue · ${summary.outstanding} to follow up`
  );
  heading.append(copy, badge);
  panel.append(heading);

  const pledgedMembers = data.members.filter((member) => Number(member.monthlyPledge) > 0);
  if (pledgedMembers.length === 0) {
    const empty = createWorkspaceElement("div", "contribution-reminders-empty");
    empty.append(
      createWorkspaceElement("i", "fa-solid fa-bullseye"),
      createWorkspaceElement("strong", "", "Set monthly pledges to start tracking"),
      createWorkspaceElement(
        "p",
        "",
        "Add or edit a member to set their monthly pledge. Akiba will show this month's paid, due, and overdue amounts here."
      )
    );
    panel.append(empty);
    container.append(panel);
    return;
  }

  const tableWrap = createWorkspaceElement("div", "contribution-reminders-table-wrap");
  const table = createWorkspaceElement("table", "contribution-reminders-table");
  const header = createWorkspaceElement("thead");
  const headerRow = createWorkspaceElement("tr");
  ["Member", "Monthly pledge", "Received", "Outstanding", "Status", "Reminder"].forEach((label) => {
    const cell = createWorkspaceElement("th", "", label);
    cell.scope = "col";
    headerRow.append(cell);
  });
  header.append(headerRow);
  const body = createWorkspaceElement("tbody");
  pledgedMembers.forEach((member) => {
    const status = getMonthlyContributionStatus(member, now);
    const row = createWorkspaceElement("tr");
    [
      member.name,
      formatCurrency(status.pledge),
      formatCurrency(status.received),
      formatCurrency(status.outstanding)
    ].forEach((value, index) => {
      const cell = createWorkspaceElement("td", index === 3 && status.outstanding > 0 ? "amount-negative" : "");
      cell.textContent = value;
      row.append(cell);
    });
    const statusCell = createWorkspaceElement("td");
    const statusBadge = createWorkspaceElement(
      "span",
      `contribution-status-badge ${status.status.toLowerCase().replaceAll(" ", "-")}`,
      status.status
    );
    statusCell.append(statusBadge);
    row.append(statusCell);

    const reminderCell = createWorkspaceElement("td");
    if (status.outstanding > 0) {
      const reminderButton = createWorkspaceElement("button", "contribution-reminder-button");
      reminderButton.type = "button";
      reminderButton.disabled = !normalizeKenyanWhatsAppNumber(member.phone);
      reminderButton.title = reminderButton.disabled
        ? "Add a valid Kenyan phone number to this member to send a reminder."
        : `Prepare a WhatsApp reminder for ${member.name}`;
      reminderButton.append(
        createWorkspaceElement("i", "fa-brands fa-whatsapp"),
        document.createTextNode(" Remind")
      );
      reminderButton.addEventListener("click", () =>
        openContributionReminder(member, status, month)
      );
      reminderCell.append(reminderButton);
    } else {
      reminderCell.textContent = "—";
    }
    row.append(reminderCell);
    body.append(row);
  });
  table.append(header, body);
  tableWrap.append(table);
  panel.append(tableWrap);
  container.append(panel);
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
  const fieldGroup = document.createElement("div");
  fieldGroup.className = `modal-field modal-field-${field.name}`;
  fieldGroup.hidden = Boolean(field.hidden);

  const label = document.createElement("label");
  const id = `action-${field.name}`;
  label.htmlFor = id;
  label.textContent = field.label;

  const control = field.options ? document.createElement("select") : document.createElement("input");
  control.id = id;
  control.name = field.name;
  control.required = field.required !== false;
  if (field.hidden) control.required = false;

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

  fieldGroup.append(label, control);
  modalFields.append(fieldGroup);
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
      { name: "monthlyPledge", label: "Monthly contribution pledge (KES)", type: "number", min: "0", step: "1", required: false, value: "0" },
      {
        name: "role",
        label: "Member role",
        options: ["Member", "Chairperson", "Treasurer", "Secretary"].map((role) => ({ value: role, label: role }))
      }
    ]
  },
  "Record Contribution": {
    title: "Record Contribution",
    description: "Send an M-Pesa prompt or record a cash contribution.",
    success: "Contribution recorded successfully.",
    fields: [
      { name: "member", label: "Member name", placeholder: "Enter member name" },
      { name: "amount", label: "Amount (KES)", type: "number", min: "0.01", step: "any" },
      {
        name: "paymentMethod",
        label: "Payment method",
        value: "mpesa",
        options: [
          { value: "mpesa", label: "M-Pesa STK Push" },
          { value: "manual", label: "Record cash / other payment" }
        ]
      },
      {
        name: "phone",
        label: "M-Pesa phone number",
        type: "tel",
        required: false,
        placeholder: "e.g. 0712 345 678"
      }
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
      { name: "adminEmail", label: "Administrator email", type: "email", required: false, value: data.settings.adminEmail },
      { name: "contributionDueDay", label: "Monthly contribution due day (1–28)", type: "number", min: "1", max: "28", step: "1", value: data.settings.contributionDueDay }
    ]
  }
};

function openForm(action, memberId = null) {
  const definition = actionForms[action];
  if (!definition) return;

  activeAction = action;
  modal.querySelector(".modal").classList.toggle("is-contribution", action === "Record Contribution");
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
  const fields = definition.fields.flatMap((field) => {
    if (action !== "Record Contribution" || field.name !== "member" || data.members.length === 0) {
      return [field];
    }

    const memberOptions = data.members.map((item) => ({
      value: item.id,
      label: item.phone ? `${item.name} (${item.phone})` : item.name
    }));
    return [
      {
        ...field,
        value: data.members[0].id,
        options: [
          ...memberOptions,
          { value: "__other__", label: "Other / not listed" }
        ]
      },
      {
        name: "otherMemberName",
        label: "Member name",
        placeholder: "Enter member name",
        required: false,
        hidden: true
      }
    ];
  });
  fields.forEach((field) => {
    createField(member ? { ...field, value: member[field.name] ?? "" } : field);
  });
  if (action === "Record Contribution" && data.members.length > 0) {
    setContributionPhoneForMember(data.members[0].id);
  }
  updateContributionFields();
  modal.classList.add("open");
  modal.querySelector("input, select")?.focus();
}

function closeForm() {
  modal.classList.remove("open");
  modal.querySelector(".modal").classList.remove("is-contribution");
  form.reset();
  editingMemberId = null;
}

function recordTransaction(description, type, amount, date = new Date().toISOString()) {
  data.transactions.push({
    description,
    type,
    amount,
    date
  });
}

function updateContributionFields() {
  if (activeAction !== "Record Contribution") return;
  const paymentMethod = form.elements.namedItem("paymentMethod")?.value;
  const phoneInput = form.elements.namedItem("phone");
  const phoneField = modalFields.querySelector(".modal-field-phone");
  const memberInput = form.elements.namedItem("member");
  const otherMemberInput = form.elements.namedItem("otherMemberName");
  const otherMemberField = modalFields.querySelector(".modal-field-otherMemberName");

  if (otherMemberInput instanceof HTMLInputElement && otherMemberField) {
    const useOtherMember = memberInput instanceof HTMLSelectElement &&
      memberInput.value === "__other__";
    otherMemberField.hidden = !useOtherMember;
    otherMemberInput.required = useOtherMember;
  }

  if (phoneInput instanceof HTMLInputElement && phoneField) {
    const useMpesa = paymentMethod === "mpesa";
    phoneInput.required = useMpesa;
    phoneField.hidden = !useMpesa;
    phoneInput.autocomplete = "tel";
    document.getElementById("contributionPaymentHint").hidden = !useMpesa;
  }

  const submitButton = form.querySelector(".save-button");
  if (submitButton) {
    submitButton.textContent = paymentMethod === "mpesa"
      ? "Send STK Push prompt"
      : "Record contribution";
  }
}

function setContributionPhoneForMember(memberId) {
  const phoneInput = form.elements.namedItem("phone");
  if (!(phoneInput instanceof HTMLInputElement)) return;

  const member = data.members.find((item) => item.id === memberId);
  phoneInput.value = member?.phone || "";
}

function contributionMemberName(values) {
  const member = data.members.find((item) => item.id === values.member);
  if (member) return member.name;
  if (values.member === "__other__") {
    return typeof values.otherMemberName === "string" ? values.otherMemberName.trim() : "";
  }
  return typeof values.member === "string" ? values.member.trim() : "";
}

function contributionMemberId(values) {
  const member = data.members.find((item) => item.id === values.member);
  return member?.id || null;
}

modalFields.addEventListener("change", (event) => {
  updateContributionFields();
  if (event.target instanceof HTMLSelectElement && event.target.name === "member") {
    setContributionPhoneForMember(event.target.value);
  }
});

async function startMpesaContribution(memberName, phone, amount, memberId) {
  const response = await fetch("/api/mpesa/stk-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberName, phone, amount, chamaId: activeChamaId })
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Could not start the M-Pesa payment.");
  }

  const payment = {
    checkoutRequestId: result.checkoutRequestId,
    member: memberName,
    amount,
    startedAt: new Date().toISOString(),
    ...(memberId ? { memberId } : {})
  };
  data.pendingMpesaPayments.push(payment);
  saveData();
  renderDashboard();
  const activePage = document.querySelector(".nav-link.active")?.dataset.page;
  if (activePage && !["Dashboard", "Members"].includes(activePage)) {
    renderWorkspacePage(activePage);
  }
  closeForm();
  showMessage(`${result.message} Approve it on ${phone}.`);
  void monitorMpesaPayment(payment);
}

async function monitorMpesaPayment(payment) {
  const checkoutRequestId = payment.checkoutRequestId;
  if (paymentWatches.has(checkoutRequestId)) return;
  paymentWatches.add(checkoutRequestId);

  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }

      let response;
      try {
        response = await fetch(
          `/api/mpesa/status/${encodeURIComponent(checkoutRequestId)}`,
          { cache: "no-store" }
        );
      } catch {
        continue;
      }

      const status = await response.json();
      if (!response.ok) {
        throw new Error(status.error || "Could not check this M-Pesa payment.");
      }
      if (status.status === "pending") continue;

      data.pendingMpesaPayments = data.pendingMpesaPayments.filter(
        (item) => item.checkoutRequestId !== checkoutRequestId
      );
      if (status.status === "completed") {
        const alreadyRecorded = data.contributions.some(
          (item) => item.checkoutRequestId === checkoutRequestId
        );
        if (!alreadyRecorded) {
          data.contributions.push({
            member: status.memberName,
            ...(payment.memberId ? { memberId: payment.memberId } : {}),
            amount: status.amount,
            date: status.completedAt || new Date().toISOString(),
            paymentMethod: "M-Pesa",
            receiptNumber: status.receiptNumber,
            checkoutRequestId
          });
          recordTransaction(
            `M-Pesa contribution — ${status.memberName} (${status.receiptNumber})`,
            "income",
            status.amount,
            status.completedAt || new Date().toISOString()
          );
        }
        saveData();
        renderDashboard();
        refreshActiveWorkspace();
        showMessage(`M-Pesa contribution received. Receipt: ${status.receiptNumber}.`);
      } else {
        saveData();
        showMessage(status.failureReason || "The M-Pesa payment was not completed.");
      }
      return;
    }

    showMessage("Payment is still pending. Akiba will keep checking while this page is open.");
  } catch (error) {
    showMessage(error.message || "Could not confirm the M-Pesa payment status.");
  } finally {
    paymentWatches.delete(checkoutRequestId);
  }
}

function refreshActiveWorkspace() {
  const activePage = document.querySelector(".nav-link.active")?.dataset.page;
  if (activePage && !["Dashboard", "Members"].includes(activePage)) {
    if (activePage === "Approvals") void renderApprovalsPage();
    else renderWorkspacePage(activePage);
  }
}

async function renderApprovalsPage() {
  const workspace = document.getElementById("workspacePage");
  workspace.replaceChildren();
  const heading = createWorkspaceElement("section", "workspace-page-heading");
  const copy = createWorkspaceElement("div");
  copy.append(
    createWorkspaceElement("p", "members-eyebrow", "Chama workspace / governance"),
    createWorkspaceElement("h1", "", "Financial approvals"),
    createWorkspaceElement("p", "", "Review significant financial operations before they are added to the chama records.")
  );
  heading.append(copy);
  workspace.append(heading);

  const response = await fetch(`/api/chamas/${encodeURIComponent(activeChamaId)}/approvals`, {
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) {
    showMessage(result.error || "Could not load financial approvals.");
    return;
  }
  if (!result.approvals.length) {
    const empty = createWorkspaceElement("section", "members-list-panel members-empty-state");
    empty.append(
      createWorkspaceElement("strong", "", "No financial approvals"),
      createWorkspaceElement("p", "", "Significant operations submitted by treasurers will appear here.")
    );
    workspace.append(empty);
    return;
  }

  const list = createWorkspaceElement("section", "approval-list");
  result.approvals.forEach((approval) => {
    const item = createWorkspaceElement("article", "approval-item");
    const details = createWorkspaceElement("div", "approval-item-details");
    details.append(
      createWorkspaceElement("strong", "", approval.description),
      createWorkspaceElement("small", "", `${formatCurrency(Number(approval.amount))} · Requested ${new Date(approval.createdAt).toLocaleDateString("en-GB")}`)
    );
    const status = createWorkspaceElement("span", `approval-status approval-${approval.status}`, approval.status);
    item.append(details, status);
    if (approval.status === "pending" && ["chairperson", "platform_admin"].includes(currentRole)) {
      const actions = createWorkspaceElement("div", "approval-actions");
      for (const decision of ["approved", "rejected"]) {
        const button = createWorkspaceElement("button", decision === "approved" ? "approval-approve" : "approval-reject", decision === "approved" ? "Approve" : "Reject");
        button.type = "button";
        button.addEventListener("click", async () => {
          const decisionResponse = await fetch(
            `/api/chamas/${encodeURIComponent(activeChamaId)}/approvals/${encodeURIComponent(approval.id)}/decision`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ decision })
            }
          );
          const decisionResult = await decisionResponse.json();
          if (!decisionResponse.ok) {
            showMessage(decisionResult.error || "Could not review this operation.");
            return;
          }
          if (decision === "approved") {
            await loadChamaData(activeChamaId);
            renderDashboard();
          }
          showMessage(`Financial operation ${decision}.`);
          void renderApprovalsPage();
        });
        actions.append(button);
      }
      item.append(actions);
    }
    list.append(item);
  });
  workspace.append(list);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const amount = Number(values.amount);
  const definition = actionForms[activeAction];

  if (values.amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
    showMessage("Enter an amount greater than zero.");
    return;
  }

  if (activeAction === "Manage Members") {
    const monthlyPledge = values.monthlyPledge === "" ? 0 : Number(values.monthlyPledge);
    if (!Number.isInteger(monthlyPledge) || monthlyPledge < 0 || monthlyPledge > 150000) {
      showMessage("Enter a whole-number monthly pledge between KES 0 and KES 150,000.");
      return;
    }
  }

  if (activeAction === "Chama Settings") {
    const dueDay = Number(values.contributionDueDay);
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
      showMessage("Choose a monthly contribution due day from 1 to 28.");
      return;
    }
  }

  if (activeAction === "Record Contribution" && values.paymentMethod === "mpesa") {
    if (!Number.isInteger(amount)) {
      showMessage("M-Pesa contributions must be a whole number of shillings.");
      return;
    }
    const submitButton = form.querySelector(".save-button");
    submitButton.disabled = true;
    submitButton.textContent = "Sending prompt…";
    try {
      await startMpesaContribution(
        contributionMemberName(values),
        values.phone.trim(),
        amount,
        contributionMemberId(values)
      );
    } catch (error) {
      showMessage(error.message || "Could not start the M-Pesa payment.");
    } finally {
      submitButton.disabled = false;
      updateContributionFields();
    }
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
        member.monthlyPledge = Number(values.monthlyPledge) || 0;
        member.role = values.role;
      } else {
        data.members.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          monthlyPledge: Number(values.monthlyPledge) || 0,
          role: values.role
        });
      }
      break;
    case "Record Contribution":
      {
        const memberId = contributionMemberId(values);
        const contribution = {
          member: contributionMemberName(values),
          amount,
          date: new Date().toISOString(),
          paymentMethod: "Cash / other",
          receiptNumber: createReceiptNumber(),
          ...(memberId ? { memberId } : {})
        };
        data.contributions.push(contribution);
        recordTransaction(`Contribution — ${contribution.member}`, "income", amount);
      }
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
        adminEmail: values.adminEmail.trim(),
        contributionDueDay: Number(values.contributionDueDay)
      };
      break;
    default:
      return;
  }

  const wasEditingMember = activeAction === "Manage Members" && editingMemberId !== null;
  saveData();
  renderDashboard();
  refreshActiveWorkspace();
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
      description: "Review your chama profile and keep a private backup of its records.",
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
  if (page === "Settings") {
    const backupPanel = createWorkspaceElement("section", "backup-panel");
    backupPanel.setAttribute("aria-labelledby", "backupPanelTitle");
    const backupCopy = createWorkspaceElement("div", "backup-panel-copy");
    const backupIcon = createWorkspaceElement("span", "backup-panel-icon");
    backupIcon.append(createWorkspaceElement("i", "fa-solid fa-shield-halved"));
    const backupDetails = createWorkspaceElement("div");
    backupDetails.append(
      createWorkspaceElement("h2", "", "Your data, in your hands"),
      createWorkspaceElement(
        "p",
        "",
        "Download a private backup of your chama records or restore them on this browser."
      )
    );
    backupDetails.querySelector("h2").id = "backupPanelTitle";
    backupCopy.append(backupIcon, backupDetails);

    const backupActions = createWorkspaceElement("div", "backup-panel-actions");
    const downloadButton = createWorkspaceElement("button", "backup-button backup-button-primary");
    downloadButton.type = "button";
    downloadButton.append(
      createWorkspaceElement("i", "fa-solid fa-download"),
      document.createTextNode(" Download backup")
    );
    downloadButton.addEventListener("click", downloadBackup);

    const restoreButton = createWorkspaceElement("button", "backup-button backup-button-secondary");
    restoreButton.type = "button";
    restoreButton.append(
      createWorkspaceElement("i", "fa-solid fa-upload"),
      document.createTextNode(" Restore backup")
    );

    const restoreInput = createWorkspaceElement("input");
    restoreInput.type = "file";
    restoreInput.accept = ".json,application/json";
    restoreInput.hidden = true;
    restoreInput.setAttribute("aria-label", "Choose an Akiba JSON backup");
    restoreButton.addEventListener("click", () => restoreInput.click());
    restoreInput.addEventListener("change", async () => {
      const file = restoreInput.files?.[0];
      restoreInput.value = "";
      if (file) await restoreBackup(file);
    });

    backupActions.append(downloadButton, restoreButton, restoreInput);
    const privacyNote = createWorkspaceElement("p", "backup-privacy-note");
    privacyNote.append(
      createWorkspaceElement("i", "fa-solid fa-lock"),
      document.createTextNode(
        " Backups include member contact details and financial records. They stay on your device; store downloaded files somewhere private."
      )
    );
    backupPanel.append(backupCopy, backupActions, privacyNote);
    workspace.append(backupPanel);
  }
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
    void loadChamaMembers();
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
  if (page === "Approvals") void renderApprovalsPage();
  else renderWorkspacePage(page);
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
    data.pendingMpesaPayments.forEach((payment) => {
      if (payment?.checkoutRequestId) void monitorMpesaPayment(payment);
    });
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
  if (["chairperson", "platform_admin"].includes(currentRole)) openForm("Chama Settings");
});

document.getElementById("chamaSwitcher").addEventListener("change", async (event) => {
  try {
    await loadChamaData(event.currentTarget.value);
    renderDashboard();
    refreshActiveWorkspace();
    data.pendingMpesaPayments.forEach((payment) => {
      if (payment?.checkoutRequestId) void monitorMpesaPayment(payment);
    });
  } catch (error) {
    showMessage(error.message || "Could not switch to that chama.");
  }
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

const appLoader = document.getElementById("appLoader");
async function initializeDashboard() {
  try {
    await loadChamaData();
    renderDashboard();
    data.pendingMpesaPayments.forEach((payment) => {
      if (payment?.checkoutRequestId) void monitorMpesaPayment(payment);
    });
  } catch (error) {
    showMessage(error.message || "Could not load your chama workspace.");
  } finally {
    window.setTimeout(() => {
      appLoader.classList.add("is-hidden");
      appLoader.setAttribute("aria-hidden", "true");
    }, 250);
  }
}

void initializeDashboard();

window.setTimeout(() => {
  appLoader.classList.add("is-hidden");
  appLoader.setAttribute("aria-hidden", "true");
}, 4000);
