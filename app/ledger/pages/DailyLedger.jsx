import { ChevronLeft, ChevronRight, Plus, Trash2, Truck } from "lucide-react";
import {
  createId,
  ensureDay,
  formatDate,
  formatNumber,
  FUELS,
  STATUS,
  toNumberOrNull,
} from "../domain.js";
import { FuelPill, NumberField, PageHeading, StatusBadge } from "../components/Common.jsx";

function NumericInput({ value, onChange, ariaLabel, className = "" }) {
  return (
    <input
      className={className}
      type="number"
      inputMode="decimal"
      step="any"
      min="0"
      value={value ?? ""}
      aria-label={ariaLabel}
      onChange={(event) => onChange(toNumberOrNull(event.target.value))}
    />
  );
}

function DayNavigator({ days, selectedDay, onSelect }) {
  const scrollTo = (day) => {
    onSelect(Math.min(Math.max(day, 1), days.length));
    requestAnimationFrame(() => document.getElementById(`day-${day}`)?.scrollIntoView({ inline: "center" }));
  };
  return (
    <div className="day-navigator">
      <button type="button" className="icon-button" onClick={() => scrollTo(selectedDay - 1)} aria-label="اليوم السابق">
        <ChevronRight />
      </button>
      <div className="day-list">
        {days.map((day) => {
          const valid = FUELS.every((fuel) => day.fuelSummaries[fuel.id].status === STATUS.valid);
          return (
            <button
              id={`day-${day.dayNumber}`}
              key={day.dayNumber}
              type="button"
              className={`day-chip ${day.dayNumber === selectedDay ? "is-active" : ""} ${valid ? "is-valid" : ""}`}
              onClick={() => onSelect(day.dayNumber)}
            >
              <small>يوم</small><b>{day.dayNumber}</b><span />
            </button>
          );
        })}
      </div>
      <button type="button" className="icon-button" onClick={() => scrollTo(selectedDay + 1)} aria-label="اليوم التالي">
        <ChevronLeft />
      </button>
    </div>
  );
}

function FuelSummary({ fuel, summary, dayNumber, onOpeningBalance }) {
  return (
    <article className={`daily-summary-card ${fuel.tone}`}>
      <div className="card-title-row">
        <div><FuelPill fuel={fuel} /><h2>ملخص {fuel.name}</h2></div>
        <StatusBadge status={summary.status} />
      </div>
      <div className="daily-balance-grid">
        {dayNumber === 1 ? (
          <label className="number-input-card">
            <span>رصيد سابق</span>
            <NumericInput
              value={summary.previousBalance}
              onChange={onOpeningBalance}
              ariaLabel={`الرصيد السابق ${fuel.name}`}
            />
            <small>لتر</small>
          </label>
        ) : <NumberField label="رصيد سابق" value={summary.previousBalance} />}
        <NumberField label="الوارد" value={summary.deliveries} />
        <NumberField label="مجموع الرصيد" value={summary.totalBalance} />
        <NumberField label="المنصرف" value={summary.dispensed} />
        <NumberField label="العيارات" value={summary.calibration} />
        <NumberField label="الرصيد" value={summary.balance} />
      </div>
      <div className="ending-balance">
        <span>الرصيد المتبقي نهاية اليوم</span>
        <strong>{formatNumber(summary.endingBalance)}</strong>
        <small>لتر</small>
      </div>
    </article>
  );
}

function NozzleSection({ fuel, nozzles, onEdit }) {
  return (
    <section className={`section-card nozzle-section ${fuel.tone}`}>
      <div className="section-title">
        <div><FuelPill fuel={fuel} /><h2>قراءات مسدسات {fuel.name}</h2></div>
        <small>قراءة الفتح تنتقل تلقائيًا من غلق اليوم السابق</small>
      </div>
      <div className="nozzle-table" role="table" aria-label={`مسدسات ${fuel.name}`}>
        <div className="nozzle-head" role="row">
          <span>الطلمبة / المسدس</span><span>الفتح</span><span>الغلق</span><span>الفرق</span><span>العيارات</span><span>المراجعة</span>
        </div>
        {nozzles.length === 0 ? <p className="empty-state">لا توجد مسدسات نشطة لهذا النوع.</p> : nozzles.map((item) => (
          <div className="nozzle-row" role="row" key={item.id}>
            <div data-label="المسدس"><b>{item.pump || "طلمبة"}</b><small>{item.nozzle || "مسدس"}</small></div>
            <div data-label="الفتح" className="readonly-value">{formatNumber(item.opening)}</div>
            <div data-label="الغلق">
              <NumericInput
                value={item.closing}
                onChange={(value) => onEdit(item.id, "closing", value)}
                ariaLabel={`قراءة الغلق ${item.pump} ${item.nozzle}`}
                className="entry-input"
              />
            </div>
            <div data-label="الفرق" className="readonly-value strong">{formatNumber(item.difference)}</div>
            <div data-label="العيارات">
              <NumericInput
                value={item.calibrationEntered}
                onChange={(value) => onEdit(item.id, "calibration", value)}
                ariaLabel={`العيارات ${item.pump} ${item.nozzle}`}
                className="entry-input"
              />
            </div>
            <div data-label="المراجعة"><StatusBadge status={item.status} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Deliveries({ deliveries, onAdd, onEdit, onRemove }) {
  return (
    <section className="section-card deliveries-section">
      <div className="section-title">
        <div><span className="section-icon"><Truck /></span><h2>وارد اليوم</h2></div>
        <button type="button" className="secondary-button" onClick={onAdd}><Plus size={18} /> إضافة وارد</button>
      </div>
      {deliveries.length === 0 ? (
        <div className="empty-state compact">لا يوجد وارد مسجل لهذا اليوم.</div>
      ) : (
        <div className="delivery-list">
          {deliveries.map((delivery, index) => (
            <div className="delivery-row" key={delivery.id}>
              <span className="row-number">{index + 1}</span>
              <label><span>نوع الوقود</span><select value={delivery.fuelId} onChange={(event) => onEdit(delivery.id, "fuelId", event.target.value)}>{FUELS.map((fuel) => <option key={fuel.id} value={fuel.id}>{fuel.name}</option>)}</select></label>
              <label><span>الكمية باللتر</span><NumericInput value={delivery.quantity} onChange={(value) => onEdit(delivery.id, "quantity", value)} ariaLabel="كمية الوارد" /></label>
              <label><span>رقم المرجع</span><input value={delivery.reference} onChange={(event) => onEdit(delivery.id, "reference", event.target.value)} /></label>
              <label><span>ملاحظات</span><input value={delivery.notes} onChange={(event) => onEdit(delivery.id, "notes", event.target.value)} /></label>
              <button type="button" className="danger-icon" onClick={() => onRemove(delivery.id)} aria-label="حذف الوارد"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DailyLedger({ calculation, selectedDay, onSelectDay, editState }) {
  const day = calculation.days[selectedDay - 1] ?? calculation.days[0];

  const editDay = (mutator) => editState((draft) => mutator(ensureDay(draft, day.dayNumber)));
  const editNozzle = (nozzleId, field, value) => editDay((dayData) => {
    dayData.nozzleEntries[nozzleId] ||= { closing: null, calibration: null };
    dayData.nozzleEntries[nozzleId][field] = value;
  });
  const addDelivery = () => editDay((dayData) => dayData.deliveries.push({
    id: createId("delivery"), fuelId: "diesel", quantity: null, reference: "", notes: "",
  }));
  const editDelivery = (id, field, value) => editDay((dayData) => {
    const delivery = dayData.deliveries.find((item) => item.id === id);
    if (delivery) delivery[field] = value;
  });
  const removeDelivery = (id) => editDay((dayData) => {
    dayData.deliveries = dayData.deliveries.filter((item) => item.id !== id);
  });

  return (
    <>
      <PageHeading
        eyebrow="الحركة اليومية"
        title={`اليوم ${day.dayNumber}`}
        description={formatDate(day.date)}
      />
      <DayNavigator days={calculation.days} selectedDay={day.dayNumber} onSelect={onSelectDay} />

      <section className="daily-summary-grid">
        {FUELS.map((fuel) => (
          <FuelSummary
            key={fuel.id}
            fuel={fuel}
            summary={day.fuelSummaries[fuel.id]}
            dayNumber={day.dayNumber}
            onOpeningBalance={(value) => editDay((dayData) => { dayData.openingBalances[fuel.id] = value; })}
          />
        ))}
      </section>

      {FUELS.map((fuel) => (
        <NozzleSection
          key={fuel.id}
          fuel={fuel}
          nozzles={day.nozzles.filter((nozzle) => nozzle.fuelId === fuel.id)}
          onEdit={editNozzle}
        />
      ))}

      <Deliveries
        deliveries={day.data.deliveries}
        onAdd={addDelivery}
        onEdit={editDelivery}
        onRemove={removeDelivery}
      />
    </>
  );
}
