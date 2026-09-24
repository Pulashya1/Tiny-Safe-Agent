import { CircleCheck, Download, OctagonX } from "lucide-react";
import type { Report } from "../types";
import { KIND_OF } from "./Pipeline";
import { Button, Card, money } from "./ui";

const chip = {
  stop: "bg-stop-soft text-stop",
  block: "bg-block-soft text-block",
  wait: "bg-wait-soft text-wait",
};

const list = (d: Record<string, number>) =>
  Object.entries(d)
    .map(([name, n]) => `${n} ${name}`)
    .join(", ");

// SAFETY 11 - the end-of-run safety report (observability).
export function SafetyReport({ report }: { report: Report }) {
  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safety_report.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const finished = report.outcome === "finished";
  const stats = [
    { value: `${report.steps_taken} / ${report.step_limit}`, label: "Steps taken" },
    { value: money(report.total_cost_usd), label: "Total cost" },
    {
      value: report.budget_used_percent === null ? "n/a" : `${report.budget_used_percent}%`,
      label: `of $${report.budget_usd.toFixed(4)} budget`,
    },
  ];

  return (
    <Card>
      <div className="px-5 pt-4">
        <h2 className="text-[0.9375rem] font-semibold">Safety report</h2>
        <p className={`mt-1 flex items-start gap-1.5 text-sm ${finished ? "text-ok" : "text-stop"}`}>
          {finished ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <OctagonX className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span className="[overflow-wrap:anywhere]">{report.end_reason}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 px-5 pt-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-sunken px-3.5 py-3">
            <div className="tabular text-lg font-bold">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2.5 px-5 pt-4 text-sm">
        <dt className="text-muted">Actions</dt>
        <dd>{list(report.actions_by_type)}</dd>
        <dt className="text-muted">Your decisions</dt>
        <dd>
          {report.approvals} approved, {report.rejections} rejected
        </dd>
        <dt className="text-muted">Blocked</dt>
        <dd>{list(report.blocked_actions)}</dd>
        <dt className="text-muted">Safeguards fired</dt>
        <dd className="flex flex-wrap gap-1.5">
          {report.safeguards_fired.length === 0
            ? "None, the run was clean"
            : report.safeguards_fired.map((name) => (
                <span
                  key={name}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip[KIND_OF[name] ?? "block"]}`}
                >
                  {name}
                </span>
              ))}
        </dd>
        <dt className="text-muted">Resumed after a crash</dt>
        <dd>{report.resumed ? "Yes" : "No"}</dd>
      </dl>

      <div className="px-5 pt-4 pb-5">
        <Button size="sm" onClick={download}>
          <Download className="size-3.5" aria-hidden /> Download report (JSON)
        </Button>
      </div>
    </Card>
  );
}
