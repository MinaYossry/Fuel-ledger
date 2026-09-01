import {
  CalendarDays,
  ChartNoAxesCombined,
  Fuel,
  Gauge,
  Save,
  Settings,
} from "lucide-react";
import { monthLabel } from "../domain.js";

const NAV_ITEMS = [
  { id: "dashboard", label: "الرئيسية", Icon: Gauge },
  { id: "daily", label: "الحركة اليومية", Icon: CalendarDays },
  { id: "monthly", label: "الملخص الشهري", Icon: ChartNoAxesCombined },
  { id: "settings", label: "الإعدادات", Icon: Settings },
];

function Navigation({ page, onNavigate, mobile = false }) {
  return (
    <nav className={mobile ? "mobile-nav" : "sidebar-nav"} aria-label="التنقل الرئيسي">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={page === id ? "nav-link is-active" : "nav-link"}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function Shell({
  children,
  page,
  onNavigate,
  onSave,
  saving,
  dirty,
  stationName,
  activePeriod,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Fuel size={25} /></span>
          <span><b>دفتر المحطة</b><small>إدارة حركة الوقود</small></span>
        </div>
        <Navigation page={page} onNavigate={onNavigate} />
        <div className="sidebar-foot">
          <div className="station-chip"><span>{stationName}</span><small>مستخدم واحد</small></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">السجل النشط</span>
            <strong>{monthLabel(activePeriod.year, activePeriod.month)}</strong>
          </div>
          <button
            type="button"
            className={dirty ? "primary-button save-button has-changes" : "primary-button save-button"}
            onClick={onSave}
            disabled={saving || !dirty}
          >
            <Save size={18} />
            {saving ? "جارٍ الحفظ..." : dirty ? "حفظ التغييرات" : "تم الحفظ"}
          </button>
        </header>
        <main className="main-content">{children}</main>
      </div>

      <Navigation page={page} onNavigate={onNavigate} mobile />
    </div>
  );
}
