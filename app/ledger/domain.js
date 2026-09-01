export const FUELS = Object.freeze([
  { id: "diesel", name: "سولار", tone: "diesel" },
  { id: "petrol92", name: "بنزين 92", tone: "petrol" },
]);

export const STATUS = Object.freeze({
  valid: "سليم",
  missingPreviousBalance: "الرصيد السابق مطلوب",
  incomplete: "غير مكتمل",
  negativeBalance: "رصيد سالب",
  missingOpening: "قراءة الفتح مطلوبة",
  missingClosing: "قراءة الغلق مطلوبة",
  closingBelowOpening: "الغلق أقل من الفتح",
  calibrationAboveDifference: "العيارات أكبر من الفرق",
  invalidCalibration: "قيمة العيارات غير صحيحة",
  noActiveNozzles: "لا توجد مسدسات نشطة",
});

export const DEFAULT_NOZZLES = Object.freeze([
  { id: "diesel-p1-n1", pump: "طلمبة 1", nozzle: "مسدس 1", fuelId: "diesel", active: true },
  { id: "diesel-p1-n2", pump: "طلمبة 1", nozzle: "مسدس 2", fuelId: "diesel", active: true },
  { id: "diesel-p2-n1", pump: "طلمبة 2", nozzle: "مسدس 1", fuelId: "diesel", active: true },
  { id: "diesel-p2-n2", pump: "طلمبة 2", nozzle: "مسدس 2", fuelId: "diesel", active: true },
  { id: "diesel-p3-n1", pump: "طلمبة 3", nozzle: "مسدس 1", fuelId: "diesel", active: true },
  { id: "diesel-p3-n2", pump: "طلمبة 3", nozzle: "مسدس 2", fuelId: "diesel", active: true },
  { id: "petrol-p1-n1", pump: "طلمبة 1", nozzle: "مسدس 1", fuelId: "petrol92", active: true },
  { id: "petrol-p1-n2", pump: "طلمبة 1", nozzle: "مسدس 2", fuelId: "petrol92", active: true },
  { id: "extra-1", pump: "", nozzle: "", fuelId: "diesel", active: false },
  { id: "extra-2", pump: "", nozzle: "", fuelId: "diesel", active: false },
  { id: "extra-3", pump: "", nozzle: "", fuelId: "diesel", active: false },
  { id: "extra-4", pump: "", nozzle: "", fuelId: "diesel", active: false },
]);

export function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function periodKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function emptyMonth() {
  return { initialReadings: {}, days: {} };
}

export function createDefaultState(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return {
    version: 2,
    settings: {
      stationName: "محطة الوقود",
      nozzles: DEFAULT_NOZZLES.map((nozzle) => ({ ...nozzle })),
    },
    activePeriod: { month, year },
    months: { [periodKey(year, month)]: emptyMonth() },
    updatedAt: new Date().toISOString(),
  };
}

function normalizeNozzle(rawNozzle, index) {
  const fallback = DEFAULT_NOZZLES[index] ?? {
    id: `nozzle-${index + 1}`,
    pump: "",
    nozzle: "",
    fuelId: "diesel",
    active: false,
  };
  return {
    id: String(rawNozzle?.id || fallback.id),
    pump: String(rawNozzle?.pump ?? fallback.pump).slice(0, 80),
    nozzle: String(rawNozzle?.nozzle ?? fallback.nozzle).slice(0, 80),
    fuelId: FUELS.some((fuel) => fuel.id === rawNozzle?.fuelId) ? rawNozzle.fuelId : fallback.fuelId,
    active: Boolean(rawNozzle?.active),
  };
}

function normalizeDelivery(rawDelivery) {
  return {
    id: String(rawDelivery?.id || createId("delivery")),
    fuelId: FUELS.some((fuel) => fuel.id === rawDelivery?.fuelId) ? rawDelivery.fuelId : "diesel",
    quantity: toNumberOrNull(rawDelivery?.quantity),
    reference: String(rawDelivery?.reference ?? "").slice(0, 120),
    notes: String(rawDelivery?.notes ?? "").slice(0, 300),
  };
}

function normalizeDay(rawDay = {}) {
  const nozzleEntries = {};
  for (const [nozzleId, entry] of Object.entries(rawDay.nozzleEntries ?? {})) {
    nozzleEntries[nozzleId] = {
      closing: toNumberOrNull(entry?.closing),
      calibration: toNumberOrNull(entry?.calibration),
    };
  }
  return {
    openingBalances: {
      diesel: toNumberOrNull(rawDay.openingBalances?.diesel),
      petrol92: toNumberOrNull(rawDay.openingBalances?.petrol92),
    },
    nozzleEntries,
    deliveries: Array.isArray(rawDay.deliveries) ? rawDay.deliveries.slice(0, 50).map(normalizeDelivery) : [],
  };
}

function normalizeMonth(rawMonth = {}, legacyReadings = {}) {
  const initialReadings = {};
  for (const [nozzleId, value] of Object.entries(rawMonth.initialReadings ?? legacyReadings)) {
    initialReadings[nozzleId] = toNumberOrNull(value);
  }
  const days = {};
  for (const [day, rawDay] of Object.entries(rawMonth.days ?? {})) {
    const dayNumber = Number(day);
    if (Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
      days[String(dayNumber)] = normalizeDay(rawDay);
    }
  }
  return { initialReadings, days };
}

export function normalizeState(rawState) {
  const fallback = createDefaultState();
  const rawMonth = Number(rawState?.activePeriod?.month ?? rawState?.settings?.month);
  const rawYear = Number(rawState?.activePeriod?.year ?? rawState?.settings?.year);
  const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : fallback.activePeriod.month;
  const year = rawYear >= 2020 && rawYear <= 2100 ? rawYear : fallback.activePeriod.year;
  const rawNozzles = Array.isArray(rawState?.settings?.nozzles)
    ? rawState.settings.nozzles.slice(0, 12)
    : fallback.settings.nozzles;
  const nozzles = rawNozzles.map(normalizeNozzle);
  while (nozzles.length < 12) nozzles.push(normalizeNozzle(null, nozzles.length));

  const legacyReadings = Object.fromEntries(
    (rawState?.settings?.nozzles ?? []).map((nozzle) => [nozzle.id, toNumberOrNull(nozzle.initialReading)]),
  );
  const months = {};
  for (const [key, rawMonthData] of Object.entries(rawState?.months ?? {})) {
    if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(key)) months[key] = normalizeMonth(rawMonthData);
  }
  const activeKey = periodKey(year, month);
  if (!months[activeKey]) {
    months[activeKey] = normalizeMonth(rawState?.days ? { days: rawState.days } : {}, legacyReadings);
  }

  return {
    version: 2,
    settings: {
      stationName: String(rawState?.settings?.stationName || fallback.settings.stationName).slice(0, 120),
      nozzles,
    },
    activePeriod: { month, year },
    months,
    updatedAt: String(rawState?.updatedAt || fallback.updatedAt),
  };
}

export function ensurePeriod(state, year = state.activePeriod.year, month = state.activePeriod.month) {
  const key = periodKey(year, month);
  if (!state.months[key]) state.months[key] = emptyMonth();
  return state.months[key];
}

export function ensureDay(state, dayNumber) {
  const monthData = ensurePeriod(state);
  const key = String(dayNumber);
  if (!monthData.days[key]) monthData.days[key] = normalizeDay();
  return monthData.days[key];
}

function calculateNozzle(nozzle, entry, opening) {
  const closing = toNumberOrNull(entry?.closing);
  const calibrationInput = toNumberOrNull(entry?.calibration);
  const calibration = calibrationInput ?? 0;
  const difference = opening === null || closing === null ? null : closing - opening;
  let status = STATUS.valid;
  if (opening === null) status = STATUS.missingOpening;
  else if (closing === null) status = STATUS.missingClosing;
  else if (closing < opening) status = STATUS.closingBelowOpening;
  else if (calibration < 0) status = STATUS.invalidCalibration;
  else if (difference !== null && calibration > difference) status = STATUS.calibrationAboveDifference;
  return { ...nozzle, opening, closing, difference, calibration, calibrationEntered: calibrationInput, status };
}

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function calculateMonth(stateInput) {
  const state = normalizeState(stateInput);
  const { year, month } = state.activePeriod;
  const monthData = state.months[periodKey(year, month)];
  const count = daysInMonth(year, month);
  const activeNozzles = state.settings.nozzles.filter((nozzle) => nozzle.active);
  let previousClosingByNozzle = Object.fromEntries(
    activeNozzles.map((nozzle) => [nozzle.id, toNumberOrNull(monthData.initialReadings[nozzle.id])]),
  );
  let previousFuelSummaries = null;
  const days = [];

  for (let dayNumber = 1; dayNumber <= count; dayNumber += 1) {
    const dayData = monthData.days[String(dayNumber)] ?? normalizeDay();
    const nozzleResults = activeNozzles.map((nozzle) =>
      calculateNozzle(nozzle, dayData.nozzleEntries[nozzle.id], previousClosingByNozzle[nozzle.id] ?? null),
    );
    const fuelSummaries = {};
    for (const fuel of FUELS) {
      const fuelNozzles = nozzleResults.filter((nozzle) => nozzle.fuelId === fuel.id);
      const previousBalance = dayNumber === 1
        ? toNumberOrNull(dayData.openingBalances[fuel.id])
        : toNumberOrNull(previousFuelSummaries?.[fuel.id]?.endingBalance);
      const deliveries = sum(
        dayData.deliveries
          .filter((delivery) => delivery.fuelId === fuel.id)
          .map((delivery) => Math.max(0, toNumberOrNull(delivery.quantity) ?? 0)),
      );
      const totalBalance = previousBalance === null ? null : previousBalance + deliveries;
      const dispensed = sum(fuelNozzles.map((nozzle) => nozzle.difference));
      const calibration = sum(fuelNozzles.map((nozzle) => nozzle.calibration));
      const balance = totalBalance === null ? null : totalBalance - dispensed;
      const endingBalance = balance === null ? null : balance + calibration;
      let status = STATUS.valid;
      if (fuelNozzles.length === 0) status = STATUS.noActiveNozzles;
      else if (previousBalance === null) status = STATUS.missingPreviousBalance;
      else if (fuelNozzles.some((nozzle) => nozzle.status !== STATUS.valid)) status = STATUS.incomplete;
      else if (endingBalance !== null && endingBalance < 0) status = STATUS.negativeBalance;
      fuelSummaries[fuel.id] = {
        fuelId: fuel.id,
        fuelName: fuel.name,
        previousBalance,
        deliveries,
        totalBalance,
        dispensed,
        calibration,
        balance,
        endingBalance,
        status,
      };
    }
    days.push({
      dayNumber,
      date: new Date(year, month - 1, dayNumber),
      data: dayData,
      nozzles: nozzleResults,
      fuelSummaries,
    });
    previousClosingByNozzle = Object.fromEntries(nozzleResults.map((nozzle) => [nozzle.id, nozzle.closing]));
    previousFuelSummaries = fuelSummaries;
  }
  return {
    state,
    days,
    daysCount: count,
    totals: Object.fromEntries(FUELS.map((fuel) => [fuel.id, calculateFuelTotals(days, fuel.id)])),
  };
}

export function calculateFuelTotals(days, fuelId) {
  const summaries = days.map((day) => day.fuelSummaries[fuelId]);
  const lastSummary = [...summaries].reverse().find((summary) => summary.status === STATUS.valid);
  return {
    deliveries: sum(summaries.map((summary) => summary.deliveries)),
    dispensed: sum(summaries.map((summary) => summary.dispensed)),
    calibration: sum(summaries.map((summary) => summary.calibration)),
    lastBalance: toNumberOrNull(lastSummary?.endingBalance),
    validDays: summaries.filter((summary) => summary.status === STATUS.valid).length,
  };
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 3 }).format(value);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function monthLabel(year, month) {
  return new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}
