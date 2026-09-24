import type { ButtonHTMLAttributes, ReactNode } from "react";

// Small shared building blocks, so every panel looks and behaves the same.

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-signal text-on-signal hover:brightness-110 shadow-sm",
  secondary: "border border-rule bg-panel text-ink hover:bg-sunken",
  danger: "bg-stop text-paper hover:brightness-110 shadow-sm",
  ghost: "text-muted hover:bg-sunken hover:text-ink",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  const sizing = size === "sm" ? "h-8 px-3 text-[0.8125rem] gap-1.5" : "h-10 px-4 text-sm gap-2";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition
        disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:brightness-100
        ${sizing} ${variants[variant]} ${focusRing} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-rule bg-panel ${className}`}>{children}</section>;
}

export function CardHeader({ title, aside, icon }: { title: string; aside?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
      <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
        {icon}
        {title}
      </h2>
      {aside && <div className="text-[0.8125rem] text-muted">{aside}</div>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition
        disabled:cursor-not-allowed disabled:opacity-45 ${checked ? "bg-signal" : "bg-rule"} ${focusRing}`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-panel shadow transition-transform
          ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

type Tone = "signal" | "stop" | "wait" | "block" | "ok";

const tones: Record<Tone, string> = {
  signal: "border-signal/40 bg-signal-soft text-signal",
  stop: "border-stop/40 bg-stop-soft text-stop",
  wait: "border-wait/40 bg-wait-soft text-wait",
  block: "border-block/40 bg-block-soft text-block",
  ok: "border-ok/40 bg-ok-soft text-ok",
};

export function Callout({
  tone,
  icon,
  title,
  children,
  actions,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div role={tone === "stop" ? "alert" : "status"} className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
          {children && <div className="mt-1 text-sm text-ink [overflow-wrap:anywhere]">{children}</div>}
          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function money(value: number) {
  return `$${value.toFixed(6)}`;
}
