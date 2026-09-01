import { Database, Download, Fuel, Upload } from "lucide-react";
import { useRef } from "react";
import { ensurePeriod, FUELS, monthLabel, periodKey, toNumberOrNull } from "../domain.js";
import { PageHeading } from "../components/Common.jsx";

function monthOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: new Intl.DateTimeFormat("ar-EG", { month: "long" }).format(new Date(2026, index, 1)),
  }));
}

export default function SettingsPage({ state, editState, onImport }) {
  const fileRef = useRef(null);
  const { year, month } = state.activePeriod;
  const currentMonth = state.months[periodKey(year, month)];

  function setPeriod(field, rawValue) {
    editState((draft) => {
      draft.activePeriod[field] = Number(rawValue);
      ensurePeriod(draft);
    });
  }

  function editNozzle(index, field, value) {
    editState((draft) => { draft.settings.nozzles[index][field] = value; });
  }

  function editInitialReading(nozzleId, value) {
    editState((draft) => { ensurePeriod(draft).initialReadings[nozzleId] = value; });
  }

  function downloadBackup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fuel-station-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await onImport(JSON.parse(await file.text()));
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="الإعدادات"
        title="إعداد الدفتر والمسدسات"
        description="عرّف المسدسات وأرقام بدايتها فقط، ثم اختر الشهر الذي تريد العمل عليه."
      />

      <section className="settings-grid">
        <article className="section-card settings-card">
          <div className="section-title"><div><span className="section-icon"><Fuel /></span><h2>بيانات الدفتر</h2></div></div>
          <label className="field"><span>اسم المحطة</span><input value={state.settings.stationName} onChange={(event) => editState((draft) => { draft.settings.stationName = event.target.value; })} /></label>
          <div className="field-row">
            <label className="field"><span>الشهر</span><select value={month} onChange={(event) => setPeriod("month", event.target.value)}>{monthOptions().map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="field"><span>السنة</span><input type="number" min="2020" max="2100" value={year} onChange={(event) => setPeriod("year", event.target.value)} /></label>
          </div>
          <div className="active-month-note"><Database size={20} /><span><small>السجل المفتوح الآن</small><b>{monthLabel(year, month)}</b></span></div>
        </article>

        <article className="section-card settings-card">
          <div className="section-title"><div><span className="section-icon"><Database /></span><h2>النسخة الاحتياطية</h2></div></div>
          <p className="muted">تشمل كل الشهور المحفوظة، إعداد المسدسات، والوارد والقراءات اليومية.</p>
          <div className="backup-actions">
            <button type="button" className="secondary-button" onClick={downloadBackup}><Download size={18} /> تنزيل نسخة JSON</button>
            <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}><Upload size={18} /> استيراد نسخة</button>
            <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={importFile} />
          </div>
          <div className="saved-months">
            <span>الشهور الموجودة:</span>
            <div>{Object.keys(state.months).sort().map((key) => <small key={key}>{key}</small>)}</div>
          </div>
        </article>
      </section>

      <section className="section-card nozzle-config">
        <div className="section-title">
          <div><span className="section-icon"><Fuel /></span><div><h2>إعداد المسدسات</h2><p>رقم البداية أدناه خاص بـ {monthLabel(year, month)}.</p></div></div>
          <span className="count-badge">{state.settings.nozzles.filter((item) => item.active).length} نشط</span>
        </div>
        <div className="config-head"><span>الحالة</span><span>الطلمبة</span><span>المسدس</span><span>نوع الوقود</span><span>رقم البداية</span></div>
        <div className="config-list">
          {state.settings.nozzles.map((nozzle, index) => (
            <div className={nozzle.active ? "config-row" : "config-row is-disabled"} key={nozzle.id}>
              <label className="switch-field" data-label="الحالة"><input type="checkbox" checked={nozzle.active} onChange={(event) => editNozzle(index, "active", event.target.checked)} /><span className="switch" /><small>{nozzle.active ? "نشط" : "متوقف"}</small></label>
              <label data-label="الطلمبة"><span className="mobile-label">الطلمبة</span><input value={nozzle.pump} onChange={(event) => editNozzle(index, "pump", event.target.value)} disabled={!nozzle.active} /></label>
              <label data-label="المسدس"><span className="mobile-label">المسدس</span><input value={nozzle.nozzle} onChange={(event) => editNozzle(index, "nozzle", event.target.value)} disabled={!nozzle.active} /></label>
              <label data-label="نوع الوقود"><span className="mobile-label">نوع الوقود</span><select value={nozzle.fuelId} onChange={(event) => editNozzle(index, "fuelId", event.target.value)} disabled={!nozzle.active}>{FUELS.map((fuel) => <option value={fuel.id} key={fuel.id}>{fuel.name}</option>)}</select></label>
              <label data-label="رقم البداية"><span className="mobile-label">رقم البداية</span><input type="number" inputMode="decimal" step="any" min="0" value={currentMonth.initialReadings[nozzle.id] ?? ""} onChange={(event) => editInitialReading(nozzle.id, toNumberOrNull(event.target.value))} disabled={!nozzle.active} /></label>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
