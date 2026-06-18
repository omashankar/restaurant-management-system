/** Shared subscription period math — trial first, then one billing cycle. */

export function parseDateInput(value) {
  if (value == null || value === "") return new Date();
  if (value instanceof Date) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid start date.");
    return d;
  }
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid start date.");
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseTrialDaysValue(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function addCalendarDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** One billing period from billingStart (after trial when applicable). */
export function computeBillingEndDate(billingStart, billingCycle = "monthly") {
  const d = new Date(billingStart);
  if (billingCycle === "yearly") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    const day = d.getDate();
    d.setMonth(d.getMonth() + 1);
    if (d.getDate() !== day) d.setDate(0);
  }
  return d;
}

/**
 * Business rule:
 * - Trial runs from startDate for trialDays (status: trial)
 * - Paid billing starts after trial ends (or at start when trialDays = 0)
 * - endDate = billingStart + 1 month/year
 */
export function computeSubscriptionSchedule({
  startDate,
  billingCycle = "monthly",
  trialDays = 0,
} = {}) {
  const start = parseDateInput(startDate ?? undefined);

  const trial = parseTrialDaysValue(trialDays);
  const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
  const trialEnd = trial > 0 ? addCalendarDays(start, trial) : null;
  const billingStart = trialEnd ?? start;
  const endDate = computeBillingEndDate(billingStart, cycle);
  const msPerDay = 86_400_000;
  const totalDays = Math.max(0, Math.ceil((endDate - start) / msPerDay));
  const paidDays = Math.max(0, Math.ceil((endDate - billingStart) / msPerDay));

  return {
    startDate: start,
    trialDays: trial,
    trialEnd,
    billingStart,
    billingCycle: cycle,
    endDate,
    totalDays,
    paidDays,
    trialPhaseDays: trial,
  };
}

export function formatDateInputValue(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getAssignPlanSchedulePreview(form) {
  const schedule = computeSubscriptionSchedule({
    startDate: form.startDate || undefined,
    billingCycle: form.billingCycle,
    trialDays: form.trialDays,
  });
  const cycleLabel = schedule.billingCycle === "yearly" ? "year" : "month";
  return {
    schedule,
    summary: describeSubscriptionSchedule(form),
    startLabel: formatDateInputValue(schedule.startDate),
    trialEndLabel: schedule.trialEnd ? formatDateInputValue(schedule.trialEnd) : null,
    billingStartLabel: formatDateInputValue(schedule.billingStart),
    endLabel: formatDateInputValue(schedule.endDate),
    cycleLabel,
    initialStatus: schedule.trialDays > 0 ? "trial" : "active",
  };
}

export function describeSubscriptionSchedule(form) {
  const schedule = computeSubscriptionSchedule({
    startDate: form.startDate || undefined,
    billingCycle: form.billingCycle,
    trialDays: form.trialDays,
  });
  const cycleLabel = schedule.billingCycle === "yearly" ? "year" : "month";
  if (schedule.trialDays === 0) {
    return `Paid period: 1 ${cycleLabel} from start (${schedule.totalDays} days total).`;
  }
  return `${schedule.trialDays}-day free trial, then 1 ${cycleLabel} paid — ${schedule.totalDays} days total (${schedule.trialDays} trial + ${schedule.paidDays} paid).`;
}

export function withAutoAssignEndDate(form) {
  const schedule = computeSubscriptionSchedule({
    startDate: form.startDate || undefined,
    billingCycle: form.billingCycle,
    trialDays: form.trialDays,
  });
  return {
    ...form,
    endDate: formatDateInputValue(schedule.endDate),
  };
}
