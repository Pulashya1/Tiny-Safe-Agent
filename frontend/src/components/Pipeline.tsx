import {
  Ban,
  Coins,
  Copy,
  Footprints,
  Hand,
  Lock,
  OctagonX,
  Repeat,
  type LucideIcon,
} from "lucide-react";

type Kind = "stop" | "block" | "wait";

// The checks in the SAME order engine.py runs them. Names match engine.py exactly,
// because a check lights up when its name appears in "safeguards_fired".
export const PIPELINE: { name: string; kind: Kind; icon: LucideIcon; tip: string }[] = [
  { name: "Stop button", kind: "stop", icon: OctagonX, tip: "You can halt the agent between any two steps." },
  { name: "Step limit", kind: "stop", icon: Footprints, tip: "The run stops after the set number of steps." },
  { name: "Budget cap", kind: "stop", icon: Coins, tip: "The run stops if the cost goes over the cap." },
  { name: "Canary token", kind: "stop", icon: Ban, tip: "The run stops if an action contains the planted secret." },
  { name: "Loop detector", kind: "stop", icon: Repeat, tip: "The run stops if the same action comes up 3 times." },
  { name: "Hard rule", kind: "block", icon: Lock, tip: "Locked tasks can never be deleted." },
  { name: "Duplicate guard", kind: "block", icon: Copy, tip: "Adding an existing task or re-completing one is skipped." },
  { name: "Human approval", kind: "wait", icon: Hand, tip: "Every delete waits for you to approve or reject it." },
];

export const KIND_OF: Record<string, Kind> = Object.fromEntries(PIPELINE.map((p) => [p.name, p.kind]));

const fired: Record<Kind, string> = {
  stop: "border-stop bg-stop-soft text-stop",
  block: "border-block bg-block-soft text-block",
  wait: "border-wait bg-wait-soft text-wait",
};
const firedBadge: Record<Kind, string> = { stop: "bg-stop", block: "bg-block", wait: "bg-wait" };

export function Pipeline({ firedNames }: { firedNames: string[] }) {
  const firedSet = new Set(firedNames);
  return (
    <section aria-labelledby="pipeline-title" className="rounded-xl border border-rule bg-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="pipeline-title" className="text-[0.9375rem] font-semibold">
          Safety checks
        </h2>
        <p className="text-[0.8125rem] text-muted">
          Every action passes these checks in order before anything changes. A check lights up when it steps in.
        </p>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
        {PIPELINE.map((check, i) => {
          const on = firedSet.has(check.name);
          const Icon = check.icon;
          return (
            <li
              key={check.name}
              title={check.tip}
              className={`relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors
                ${on ? `${fired[check.kind]} animate-fire` : "border-rule bg-panel text-muted"}`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular
                  ${on ? `${firedBadge[check.kind]} text-paper` : "bg-sunken text-muted"}`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[0.8125rem] font-semibold ${on ? "" : "text-ink"}`}>
                  {check.name}
                </span>
                <span className="block text-xs">{on ? "Stepped in" : "Standing by"}</span>
              </span>
              <Icon className="ml-auto size-4 shrink-0 opacity-70" aria-hidden />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
