import { FileDown, Printer } from "lucide-react";
import { FUELS, formatNumber, monthLabel } from "../domain.js";
import { FuelPill, PageHeading, StatusBadge } from "../components/Common.jsx";

function FuelMonthlyTable({ fuel, calculation, onOpenDay }) {
  const totals = calculation.totals[fuel.id];
  return (
    <section className={`monthly-panel ${fuel.tone}`}>
      <div className="monthly-panel-head">
        <div><FuelPill fuel={fuel} /><div><h2>الملخص الشهري — {fuel.name}</h2><p>حساب مستقل دون دمج أنواع الوقود</p></div></div>
        <div className="monthly-totals">
          <span><small>الوارد</small><b>{formatNumber(totals.deliveries)}</b></span>
          <span><small>المنصرف</small><b>{formatNumber(totals.dispensed)}</b></span>
          <span><small>العيارات</small><b>{formatNumber(totals.calibration)}</b></span>
          <span><small>آخر رصيد</small><b>{formatNumber(totals.lastBalance)}</b></span>
        </div>
      </div>
      <div className="table-scroll">
        <table className="monthly-table">
          <thead><tr><th>اليوم</th><th>رصيد سابق</th><th>الوارد</th><th>مجموع الرصيد</th><th>المنصرف</th><th>العيارات</th><th>الرصيد</th><th>المتبقي نهاية اليوم</th><th>المراجعة</th></tr></thead>
          <tbody>
            {calculation.days.map((day) => {
              const summary = day.fuelSummaries[fuel.id];
              return (
                <tr key={day.dayNumber} onClick={() => onOpenDay(day.dayNumber)} tabIndex="0">
                  <td><button type="button" className="day-link" onClick={() => onOpenDay(day.dayNumber)}>{day.dayNumber}</button></td>
                  <td>{formatNumber(summary.previousBalance)}</td>
                  <td>{formatNumber(summary.deliveries)}</td>
                  <td>{formatNumber(summary.totalBalance)}</td>
                  <td>{formatNumber(summary.dispensed)}</td>
                  <td>{formatNumber(summary.calibration)}</td>
                  <td>{formatNumber(summary.balance)}</td>
                  <td className="emphasis-cell">{formatNumber(summary.endingBalance)}</td>
                  <td><StatusBadge status={summary.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MonthlySummary({ calculation, activePeriod, onOpenDay }) {
  function exportCsv() {
    const rows = [["نوع الوقود", "اليوم", "رصيد سابق", "الوارد", "مجموع الرصيد", "المنصرف", "العيارات", "الرصيد", "الرصيد المتبقي نهاية اليوم", "المراجعة"]];
    for (const fuel of FUELS) {
      for (const day of calculation.days) {
        const summary = day.fuelSummaries[fuel.id];
        rows.push([fuel.name, day.dayNumber, summary.previousBalance, summary.deliveries, summary.totalBalance, summary.dispensed, summary.calibration, summary.balance, summary.endingBalance, summary.status]);
      }
    }
    const csv = `\ufeff${rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fuel-ledger-${activePeriod.year}-${String(activePeriod.month).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeading
        eyebrow="الملخص الشهري"
        title={monthLabel(activePeriod.year, activePeriod.month)}
        description="كل نوع وقود ظاهر في كشف مستقل بنفس أعمدة الدفتر الأصلي."
        action={<div className="heading-actions"><button className="secondary-button" type="button" onClick={exportCsv}><FileDown size={18} /> CSV</button><button className="secondary-button" type="button" onClick={() => window.print()}><Printer size={18} /> طباعة</button></div>}
      />
      {FUELS.map((fuel) => <FuelMonthlyTable key={fuel.id} fuel={fuel} calculation={calculation} onOpenDay={onOpenDay} />)}
    </>
  );
}
