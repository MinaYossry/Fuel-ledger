import { CheckCircle2, CircleAlert } from "lucide-react";
import { formatNumber, STATUS } from "../domain.js";

export function StatusBadge({ status }) {
  const valid = status === STATUS.valid;
  return (
    <span className={valid ? "status-badge valid" : "status-badge warning"}>
      {valid ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
      {status}
    </span>
  );
}

export function NumberField({ label, value }) {
  return (
    <div className="number-field">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      <small>لتر</small>
    </div>
  );
}

export function FuelPill({ fuel }) {
  return <span className={`fuel-pill ${fuel.tone}`}>{fuel.name}</span>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
