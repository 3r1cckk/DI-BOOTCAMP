export function getMonthlyContributionStatus(member, contributions, dueDay, now = new Date()) {
  const pledge = Number(member.monthlyPledge) || 0;
  const received = contributions
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
  const isOverdue = pledge > 0 && outstanding > 0 && now.getDate() > dueDay;
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  const daysUntilDue = Math.round(
    (Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000
  );
  let status = "Pledge not set";
  let state = "not-set";

  if (pledge > 0) {
    if (outstanding <= 0) {
      status = "Paid";
      state = "paid";
    } else if (isOverdue) {
      status = received > 0 ? "Partially overdue" : "Overdue";
      state = "overdue";
    } else if (daysUntilDue === 0) {
      status = received > 0 ? "Partially due today" : "Due today";
      state = "due-today";
    } else if (daysUntilDue > 0 && daysUntilDue <= 3) {
      status = received > 0
        ? `Partially paid · due in ${daysUntilDue} ${daysUntilDue === 1 ? "day" : "days"}`
        : `Due in ${daysUntilDue} ${daysUntilDue === 1 ? "day" : "days"}`;
      state = "due-soon";
    } else if (received > 0) {
      status = "Partially paid";
      state = "partial";
    } else {
      status = "Due";
      state = "due";
    }
  }

  return { pledge, received, outstanding, dueDay, daysUntilDue, isOverdue, status, state };
}

export function summarizeContributionReminders(members, contributions, dueDay, now = new Date()) {
  return members.reduce((summary, member) => {
    const status = getMonthlyContributionStatus(member, contributions, dueDay, now);
    if (status.pledge > 0 && status.outstanding > 0) {
      summary.outstanding += 1;
      summary.outstandingAmount += status.outstanding;
      if (status.isOverdue) summary.overdue += 1;
      else if (status.daysUntilDue >= 0 && status.daysUntilDue <= 3) summary.dueSoon += 1;
    }
    return summary;
  }, { outstanding: 0, outstandingAmount: 0, overdue: 0, dueSoon: 0 });
}

export function contributionMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(date);
}

export function formatDueDay(day) {
  const suffix = day % 100 >= 11 && day % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  return `${day}${suffix}`;
}
