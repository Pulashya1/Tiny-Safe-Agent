import { ShieldCheck } from "lucide-react";
import type { AgentState } from "../types";
import { ThemeToggle } from "./ThemeToggle";

const pill: Record<string, { text: (s: AgentState) => string; style: string }> = {
  idle: { text: () => "Ready", style: "bg-sunken text-muted" },
  running: {
    text: (s) => `Working on step ${s.step_count + 1} of ${s.settings.max_steps}`,
    style: "bg-signal-soft text-signal",
  },
  waiting_approval: { text: () => "Waiting for your approval", style: "bg-wait-soft text-wait" },
  finished: { text: () => "Finished", style: "bg-ok-soft text-ok" },
  stopped: { text: () => "Stopped", style: "bg-stop-soft text-stop" },
};

export function StatusPill({ state }: { state: AgentState }) {
  const p = pill[state.status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold whitespace-nowrap ${p.style}`}
    >
      <span
        className={`size-2 rounded-full bg-current ${state.status === "running" ? "animate-pulse-dot" : ""}`}
        aria-hidden
      />
      {p.text(state)}
    </span>
  );
}

export function Header({ state, model }: { state: AgentState | null; model?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-panel/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal text-on-signal">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[1.0625rem] leading-tight font-bold tracking-tight">Tiny Safe Agent</h1>
            <p className="hidden truncate text-[0.8125rem] text-muted sm:block">
              An AI agent with its safety checks in plain view
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {model && (
            <span className="hidden rounded-md border border-rule px-2 py-1 text-xs text-muted xl:inline">
              {model}
            </span>
          )}
          {state && <StatusPill state={state} />}
        </div>
      </div>
    </header>
  );
}
