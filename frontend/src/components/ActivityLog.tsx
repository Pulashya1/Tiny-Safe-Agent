import { CircleCheck, Hourglass, Info, LoaderCircle, OctagonX, ShieldBan, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AgentState, LogEntry, LogKind } from "../types";
import { Card, CardHeader, money } from "./ui";

const eventStyle: Record<Exclude<LogKind, "step">, { icon: LucideIcon; row: string }> = {
  stop: { icon: OctagonX, row: "bg-stop-soft text-stop" },
  block: { icon: ShieldBan, row: "bg-block-soft text-block" },
  wait: { icon: Hourglass, row: "bg-wait-soft text-wait" },
  ok: { icon: CircleCheck, row: "bg-ok-soft text-ok" },
  info: { icon: Info, row: "text-muted" },
};

function StepRow({ e }: { e: LogEntry }) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto] gap-x-3 px-2 py-3">
      <span className="mt-1.5 size-2 rounded-full bg-signal" aria-hidden />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[0.8125rem]">
          <span className="font-semibold">Step {e.step}</span>
          <span className="rounded-full bg-signal-soft px-2 py-px text-xs font-semibold text-signal capitalize">
            {e.action}
          </span>
        </div>
        {/* React escapes this text, so model output is always shown, never run. */}
        {e.task && <p className="mt-1 text-sm font-semibold [overflow-wrap:anywhere]">{e.task}</p>}
        {e.reason && <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">{e.reason}</p>}
      </div>
      <span className="tabular mt-0.5 text-xs text-muted">{e.cost !== null ? money(e.cost) : ""}</span>
    </li>
  );
}

function EventRow({ e }: { e: LogEntry }) {
  const { icon: Icon, row } = eventStyle[e.kind as Exclude<LogKind, "step">];
  const emphasis = e.kind !== "info";
  return (
    <li
      className={`my-1 flex items-start gap-2.5 rounded-lg px-2 text-sm [overflow-wrap:anywhere]
        ${emphasis ? `py-2.5 font-medium ${row}` : `py-2 ${row}`}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{e.text}</span>
    </li>
  );
}

export function ActivityLog({ state }: { state: AgentState }) {
  const scroller = useRef<HTMLDivElement>(null);
  const steps = state.log.filter((e) => e.kind === "step").length;
  const working = state.status === "running";

  // Follow new entries, unless you've scrolled up to read older ones.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) el.scrollTop = el.scrollHeight;
  }, [state.log.length, working]);

  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader title="Activity log" aside={`${steps} ${steps === 1 ? "step" : "steps"}`} />
      {state.goal && (
        <p className="-mt-1 px-5 pb-3 text-[0.8125rem] text-muted [overflow-wrap:anywhere]">Task: {state.goal}</p>
      )}
      <div ref={scroller} className="max-h-[560px] min-h-[240px] overflow-y-auto border-t border-rule px-3 py-2">
        {state.log.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No activity yet. Give the agent a task and click Run agent.
          </p>
        ) : (
          <ol aria-live="polite" className="divide-y divide-rule/70">
            {state.log.map((e, i) => (e.kind === "step" ? <StepRow key={i} e={e} /> : <EventRow key={i} e={e} />))}
            {working && (
              <li className="flex items-center gap-2.5 px-2 py-3 text-sm text-muted">
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Working on step {state.step_count + 1}…
              </li>
            )}
          </ol>
        )}
      </div>
    </Card>
  );
}
