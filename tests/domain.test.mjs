import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMonth,
  createDefaultState,
  daysInMonth,
  ensureDay,
  ensurePeriod,
  STATUS,
} from "../app/ledger/domain.js";

function workbookExample() {
  const state = createDefaultState(new Date(2026, 8, 1));
  const month = ensurePeriod(state);
  const diesel = state.settings.nozzles.filter((item) => item.fuelId === "diesel" && item.active);
  const petrol = state.settings.nozzles.filter((item) => item.fuelId === "petrol92" && item.active);
  const openings = [8965605, 1677564, 111722, 0, 222321, 130740, 7047182, 3967954];
  [...diesel, ...petrol].forEach((nozzle, index) => { month.initialReadings[nozzle.id] = openings[index]; });

  const day = ensureDay(state, 1);
  day.openingBalances.diesel = 26590;
  day.openingBalances.petrol92 = 10000;
  day.deliveries.push({ id: "delivery-1", fuelId: "diesel", quantity: 20000, reference: "", notes: "" });
  const closings = [8974672, 1687501, 112751, 0, 222321, 130740, 7049391, 3971258];
  const calibrations = [40, 40, 20, 0, 0, 0, 0, 0];
  [...diesel, ...petrol].forEach((nozzle, index) => {
    day.nozzleEntries[nozzle.id] = { closing: closings[index], calibration: calibrations[index] };
  });
  return state;
}

test("يحاكي أرقام ملف Excel ويفصل السولار عن بنزين 92", () => {
  const result = calculateMonth(workbookExample());
  const diesel = result.days[0].fuelSummaries.diesel;
  const petrol = result.days[0].fuelSummaries.petrol92;

  assert.deepEqual(
    {
      previous: diesel.previousBalance,
      deliveries: diesel.deliveries,
      total: diesel.totalBalance,
      dispensed: diesel.dispensed,
      calibration: diesel.calibration,
      balance: diesel.balance,
      ending: diesel.endingBalance,
    },
    { previous: 26590, deliveries: 20000, total: 46590, dispensed: 20033, calibration: 100, balance: 26557, ending: 26657 },
  );
  assert.equal(petrol.dispensed, 5513);
  assert.equal(petrol.endingBalance, 4487);
  assert.equal(Object.hasOwn(diesel, "netDispensed"), false);
  assert.notEqual(result.totals.diesel.dispensed, result.totals.petrol92.dispensed);
});

test("ينقل غلق اليوم السابق ورصيد نهايته تلقائيًا إلى اليوم التالي", () => {
  const state = workbookExample();
  const dayTwo = ensureDay(state, 2);
  const firstNozzle = state.settings.nozzles[0];
  dayTwo.nozzleEntries[firstNozzle.id] = { closing: 8975000, calibration: 0 };
  const result = calculateMonth(state);

  assert.equal(result.days[1].nozzles[0].opening, 8974672);
  assert.equal(result.days[1].fuelSummaries.diesel.previousBalance, 26657);
  assert.equal(result.days[1].fuelSummaries.petrol92.previousBalance, 4487);
});

test("يرفض قراءة غلق أقل من الفتح وعيارات أكبر من الفرق", () => {
  const state = workbookExample();
  const nozzle = state.settings.nozzles[0];
  ensureDay(state, 1).nozzleEntries[nozzle.id] = { closing: 8965600, calibration: 0 };
  assert.equal(calculateMonth(state).days[0].nozzles[0].status, STATUS.closingBelowOpening);

  ensureDay(state, 1).nozzleEntries[nozzle.id] = { closing: 8965610, calibration: 11 };
  assert.equal(calculateMonth(state).days[0].nozzles[0].status, STATUS.calibrationAboveDifference);
});

test("يحفظ كل شهر كسجل مستقل", () => {
  const state = workbookExample();
  state.activePeriod = { year: 2026, month: 10 };
  const october = ensurePeriod(state);
  assert.deepEqual(october.days, {});
  assert.ok(state.months["2026-09"].days["1"]);
  assert.ok(state.months["2026-10"]);
});

test("يحسب عدد أيام الشهر والسنة الكبيسة", () => {
  assert.equal(daysInMonth(2026, 9), 30);
  assert.equal(daysInMonth(2028, 2), 29);
  assert.equal(daysInMonth(2027, 2), 28);
});
