"use client";

import { CloudOff, Fuel, LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import Shell from "./components/Shell.jsx";
import { calculateMonth, normalizeState } from "./domain.js";
import Dashboard from "./pages/Dashboard.jsx";
import DailyLedger from "./pages/DailyLedger.jsx";
import MonthlySummary from "./pages/MonthlySummary.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <span className="loading-mark"><Fuel size={30} /></span>
      <LoaderCircle className="spin" size={25} />
      <p>جارٍ تحميل دفتر المحطة...</p>
    </main>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <main className="loading-screen error-screen">
      <span className="loading-mark error"><CloudOff size={30} /></span>
      <h1>تعذر فتح الدفتر</h1>
      <p>{message}</p>
      <button type="button" className="primary-button" onClick={onRetry}><RefreshCw size={18} /> إعادة المحاولة</button>
    </main>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [state, setState] = useState(null);
  const [etag, setEtag] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [selectedDay, setSelectedDay] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, key: Date.now() });
  }, []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await api.loadLedger();
      setState(normalizeState(payload.state));
      setEtag(payload.etag);
      setDirty(false);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const calculation = useMemo(() => (state ? calculateMonth(state) : null), [state]);
  const activePeriodKey = state ? `${state.activePeriod.year}-${state.activePeriod.month}` : "";
  useEffect(() => setSelectedDay(1), [activePeriodKey]);

  const editState = useCallback((mutator) => {
    setState((current) => {
      const draft = structuredClone(current);
      mutator(draft);
      return draft;
    });
    setDirty(true);
  }, []);

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const payload = await api.saveLedger(state, etag);
      setState(normalizeState(payload.state));
      setEtag(payload.etag);
      setDirty(false);
      showToast("تم حفظ بيانات الدفتر على الخادم.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function openDay(dayNumber) {
    setSelectedDay(dayNumber);
    setPage("daily");
  }

  async function importBackup(rawState) {
    try {
      const normalized = normalizeState(rawState);
      setState(normalized);
      setDirty(true);
      showToast("تم استيراد النسخة. اضغط حفظ لتأكيدها على الخادم.");
    } catch {
      showToast("ملف النسخة الاحتياطية غير صالح.", "error");
    }
  }

  if (loading || (!state && !loadError)) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} onRetry={loadLedger} />;

  return (
    <>
      <Shell
        page={page}
        onNavigate={setPage}
        onSave={save}
        saving={saving}
        dirty={dirty}
        stationName={state.settings.stationName}
        activePeriod={state.activePeriod}
      >
        {page === "dashboard" && (
          <Dashboard
            calculation={calculation}
            activePeriod={state.activePeriod}
            onOpenDay={openDay}
            onMonthly={() => setPage("monthly")}
          />
        )}
        {page === "daily" && (
          <DailyLedger
            calculation={calculation}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            editState={editState}
          />
        )}
        {page === "monthly" && (
          <MonthlySummary calculation={calculation} activePeriod={state.activePeriod} onOpenDay={openDay} />
        )}
        {page === "settings" && (
          <SettingsPage state={state} editState={editState} onImport={importBackup} />
        )}
      </Shell>
      {toast && <div key={toast.key} className={`toast ${toast.tone}`} role="status">{toast.message}</div>}
    </>
  );
}
