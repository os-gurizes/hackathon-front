// Sala Tática: primitives em React. Compilado para components/bundle.js
// como script clássico que lê window.React e define window.SalaTatica.
import { ICONS, ICON_NAMES } from "./icons";

declare const React: any;

const cx = (...c: any[]) => c.filter(Boolean).join(" ");

/* Icon ------------------------------------------------------------------ */
export function Icon({ name, size = 24, title, className, ...rest }: any) {
  const parts = ICONS[name];
  if (!parts) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={cx("st-icon", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {parts.map(([k, d], i) =>
        k === "f" ? <path key={i} d={d} fill="currentColor" stroke="none" /> : <path key={i} d={d} />
      )}
    </svg>
  );
}
Icon.names = ICON_NAMES;

/* Button ---------------------------------------------------------------- */
export function Button({ variant = "secondary", size = "md", icon, children, className, ...rest }: any) {
  return (
    <button
      type="button"
      {...rest}
      className={cx("st-btn st-cut", "st-btn--" + variant, size === "sm" && "st-btn--sm", className)}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : null}
      {children != null ? <span>{children}</span> : null}
    </button>
  );
}

/* SectionLabel ---------------------------------------------------------- */
export function SectionLabel({ index, children, className, as = "h2", ...rest }: any) {
  const Tag = as;
  const num = index == null ? null : String(index).padStart(2, "0");
  return (
    <Tag {...rest} className={cx("st-section", className)}>
      <span className="st-section__mark" aria-hidden="true" />
      {num ? <span className="st-section__num">{num}</span> : null}
      <span className="st-section__text">{children}</span>
      <span className="st-section__rule" aria-hidden="true" />
    </Tag>
  );
}

/* Card ------------------------------------------------------------------ */
export function Card({ title, label, index, elevated, actions, children, className, ...rest }: any) {
  return (
    <section {...rest} className={cx("st-card st-cut", elevated && "st-card--elevated", className)}>
      {label ? <SectionLabel index={index} as="div">{label}</SectionLabel> : null}
      {title || actions ? (
        <header className="st-card__head">
          {title ? <h3 className="st-card__title">{title}</h3> : <span />}
          {actions ? <div className="st-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="st-card__body">{children}</div>
    </section>
  );
}

/* Badge ----------------------------------------------------------------- */
const BADGE_ICON: Record<string, string> = { attack: "attack", defense: "defense", gold: "trophy", estimate: "" };
export function Badge({ tone = "neutral", icon, children, className, ...rest }: any) {
  const ic = icon !== undefined ? icon : BADGE_ICON[tone];
  return (
    <span {...rest} className={cx("st-badge", "st-badge--" + tone, className)}>
      {ic ? <Icon name={ic} size={14} /> : null}
      <span>{children}</span>
    </span>
  );
}

/* Tooltip --------------------------------------------------------------- */
let tipSeq = 0;
export function Tooltip({ term, children, open, placement = "top", className }: any) {
  const [id] = React.useState(() => "st-tip-" + ++tipSeq);
  const [show, setShow] = React.useState(false);
  const visible = open || show;
  return (
    <span
      className={cx("st-tip", className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        className="st-tip__term"
        aria-describedby={id}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onKeyDown={(e: any) => e.key === "Escape" && setShow(false)}
      >
        {term}
      </button>
      <span id={id} role="tooltip" className={cx("st-tip__bubble", "st-tip__bubble--" + placement, visible && "is-open")}>
        {children}
      </span>
    </span>
  );
}

/* Stat ------------------------------------------------------------------ */
export function Stat({ label, help, value, unit, delta, deltaTone, comparison, sample, minSample, estimate, className }: any) {
  const low = sample != null && minSample != null && sample < minSample;
  const tone = deltaTone || (delta == null ? "neutral" : String(delta).trim().startsWith("-") ? "down" : "up");
  return (
    <div className={cx("st-stat", low && "st-stat--low", className)}>
      <div className="st-stat__label">
        {help ? <Tooltip term={label}>{help}</Tooltip> : <span>{label}</span>}
        {estimate ? <Badge tone="estimate">Estimativa</Badge> : null}
      </div>
      <div className="st-stat__value">
        {value}
        {unit ? <span className="st-stat__unit">{unit}</span> : null}
      </div>
      {delta != null || comparison ? (
        <div className={cx("st-stat__cmp", "st-stat__cmp--" + tone)}>
          {delta != null && tone !== "neutral" ? <Icon name={tone === "down" ? "trend-down" : "trend-up"} size={16} /> : null}
          {delta != null ? <strong>{delta}</strong> : null}
          {comparison ? <span>{comparison}</span> : null}
        </div>
      ) : null}
      {low ? (
        <div className="st-stat__sample">
          Amostra pequena: {sample} de {minSample} partidas necessárias.
        </div>
      ) : null}
    </div>
  );
}

/* Tabs ------------------------------------------------------------------ */
export function Tabs({ items, value, defaultValue, onChange, label, className }: any) {
  const [inner, setInner] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const current = value ?? inner;
  const refs = React.useRef([] as any[]);
  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onChange && onChange(id);
  };
  const onKey = (e: any, i: number) => {
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % items.length;
    if (e.key === "ArrowLeft") n = (i - 1 + items.length) % items.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = items.length - 1;
    if (n >= 0) {
      e.preventDefault();
      select(items[n].id);
      refs.current[n] && refs.current[n].focus();
    }
  };
  return (
    <div role="tablist" aria-label={label} className={cx("st-tabs", className)}>
      {items.map((t: any, i: number) => {
        const on = t.id === current;
        return (
          <button
            key={t.id}
            ref={(el: any) => (refs.current[i] = el)}
            role="tab"
            type="button"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={cx("st-tab", on && "is-active")}
            onClick={() => select(t.id)}
            onKeyDown={(e: any) => onKey(e, i)}
          >
            {t.icon ? <Icon name={t.icon} size={16} /> : null}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Select ---------------------------------------------------------------- */
export function Select({ label, options, value, defaultValue, onChange, id, className, ...rest }: any) {
  const [auto] = React.useState(() => "st-sel-" + ++tipSeq);
  const fid = id || auto;
  return (
    <div className={cx("st-select", className)}>
      {label ? <label className="st-select__label" htmlFor={fid}>{label}</label> : null}
      <div className="st-select__box st-cut">
        <select
          id={fid}
          value={value}
          defaultValue={defaultValue}
          onChange={(e: any) => onChange && onChange(e.target.value)}
          {...rest}
        >
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Icon name="chevron" size={16} className="st-select__chev" />
      </div>
    </div>
  );
}

/* Table ----------------------------------------------------------------- */
export function Table({ columns, rows, caption, highlight, className }: any) {
  return (
    <table className={cx("st-table", className)}>
      {caption ? <caption>{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((c: any) => (
            <th key={c.key} scope="col" className={c.numeric ? "is-num" : undefined}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r: any, i: number) => (
          <tr key={r.id ?? i} className={highlight != null && (r.id ?? i) === highlight ? "is-highlight" : undefined}>
            {columns.map((c: any) => (
              <td key={c.key} className={c.numeric ? "is-num" : undefined}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* Drawer ---------------------------------------------------------------- */
export function Drawer({ open, title, onClose, inline, children, footer, className }: any) {
  React.useEffect(() => {
    if (!open || inline) return;
    const k = (e: any) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, inline, onClose]);
  if (!open) return null;
  const panel = (
    <aside role="dialog" aria-modal={inline ? undefined : true} aria-label={title} className={cx("st-drawer st-cut", inline && "st-drawer--inline", className)}>
      <header className="st-drawer__head">
        <h2 className="st-drawer__title">{title}</h2>
        <Button variant="ghost" size="sm" icon="close" aria-label="Fechar" onClick={onClose} />
      </header>
      <div className="st-drawer__body">{children}</div>
      {footer ? <footer className="st-drawer__foot">{footer}</footer> : null}
    </aside>
  );
  if (inline) return panel;
  return (
    <div className="st-drawer__scrim" onClick={(e: any) => e.target === e.currentTarget && onClose && onClose()}>
      {panel}
    </div>
  );
}
