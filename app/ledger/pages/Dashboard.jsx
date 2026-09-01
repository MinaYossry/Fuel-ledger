import { ArrowLeft, CalendarCheck2, Droplets, Gauge, PackagePlus } from "lucide-react";
import { FUELS, formatNumber, monthLabel, STATUS } from "../domain.js";
import { FuelPill, PageHeading, StatusBadge } from "../components/Common.jsx";

export default function Dashboard({ calculation, activePeriod, onOpenDay, onMonthly }) {
  const completed = calculation.days.filter((day) =>
    FUELS.every((fuel) => day.fuelSummaries[fuel.id].status === STATUS.valid),
  ).length;
  const nextDay = Math.min(completed + 1, calculation.daysCount);

  return (
    <>
      <PageHeading
        eyebrow="نظرة عامة"
        title="لوحة حركة الوقود"
        description={`متابعة مستقلة لكل نوع وقود خلال ${monthLabel(activePeriod.year, activePeriod.month)}.`}
        action={(
          <button type="button" className="primary-button" onClick={() => onOpenDay(nextDay)}>
            فتح اليوم {nextDay} <ArrowLeft size={18} />
          </button>
        )}
      />

      <section className="overview-strip" aria-label="حالة الشهر">
        <div><CalendarCheck2 /><span><small>أيام سليمة لكلا الوقودين</small><b>{completed} من {calculation.daysCount}</b></span></div>
        <div><Gauge /><span><small>المسدسات النشطة</small><b>{calculation.state.settings.nozzles.filter((item) => item.active).length}</b></span></div>
        <button type="button" onClick={onMonthly}>عرض تفاصيل الملخص الشهري <ArrowLeft size={18} /></button>
      </section>

      <section className="fuel-overview-grid">
        {FUELS.map((fuel) => {
          const totals = calculation.totals[fuel.id];
          const lastValid = [...calculation.days].reverse().find(
            (day) => day.fuelSummaries[fuel.id].status === STATUS.valid,
          );
          return (
            <article className={`fuel-overview-card ${fuel.tone}`} key={fuel.id}>
              <div className="card-title-row">
                <div><FuelPill fuel={fuel} /><h2>ملخص {fuel.name}</h2></div>
                <StatusBadge status={lastValid ? STATUS.valid : "بانتظار أول يوم مكتمل"} />
              </div>
              <div className="hero-balance">
                <span>آخر رصيد متبقي مسجل</span>
                <strong>{formatNumber(totals.lastBalance)}</strong>
                <small>لتر</small>
              </div>
              <div className="metric-grid">
                <div><PackagePlus /><span>إجمالي الوارد</span><b>{formatNumber(totals.deliveries)}</b><small>لتر</small></div>
                <div><Droplets /><span>إجمالي المنصرف</span><b>{formatNumber(totals.dispensed)}</b><small>لتر</small></div>
                <div><Gauge /><span>إجمالي العيارات</span><b>{formatNumber(totals.calibration)}</b><small>لتر</small></div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="formula-note">
        <div className="formula-icon">∑</div>
        <div>
          <h2>طريقة حساب الرصيد لكل نوع وقود</h2>
          <p>مجموع الرصيد = الرصيد السابق + الوارد، ثم الرصيد = مجموع الرصيد − المنصرف، ثم يُعاد مقدار العيارات إلى الرصيد المتبقي نهاية اليوم.</p>
        </div>
      </section>
    </>
  );
}
