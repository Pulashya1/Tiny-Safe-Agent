import { OctagonX, RotateCcw } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { AgentState, Config, Settings } from "../types";
import { Button, Card, Switch, money } from "./ui";

function Meter({ label, value, total, fraction }: { label: string; value: string; total: string; fraction: number }) {
  const width = Math.max(0, Math.min(fraction, 1)) * 100;
  const color = fraction >= 1 ? "bg-stop" : fraction >= 0.8 ? "bg-block" : "bg-signal";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[0.8125rem] tabular">
        <span className="text-muted">
          {label} <b className="font-semibold text-ink">{value}</b>
        </span>
        <span className="text-muted">of {total}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-sunken"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-rule px-5 py-4 first:border-t-0">
      <h3 className="mb-3 text-[0.8125rem] font-semibold text-muted">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Controls({
  state,
  config,
  onSettings,
  onStop,
  onReset,
}: {
  state: AgentState;
  config: Config | null;
  onSettings: (s: Partial<Settings>) => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const ids = { steps: useId(), budget: useId(), budgetHelp: useId() };
  const { settings } = state;
  const [minSteps, maxSteps] = config?.max_steps_range ?? [1, 20];
  const running = state.status === "running" || state.status === "waiting_approval";

  // Local drafts, so typing and dragging feel instant; the server gets the final value.
  const [steps, setSteps] = useState(settings.max_steps);
  const [budget, setBudget] = useState(String(settings.budget));
  const [budgetError, setBudgetError] = useState("");
  useEffect(() => setSteps(settings.max_steps), [settings.max_steps]);
  useEffect(() => setBudget(String(settings.budget)), [settings.budget]);

  function commitBudget() {
    const value = Number(budget);
    if (budget.trim() === "" || !Number.isFinite(value) || value < 0 || value > 1) {
      setBudgetError("Enter an amount between 0 and 1.");
      return;
    }
    setBudgetError("");
    if (value !== settings.budget) onSettings({ budget: value });
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[0.9375rem] font-semibold">Safety controls</h2>
        <p className="mt-1 text-[0.8125rem] text-muted">
          Adjustable limits for each run. Locked tasks are a hard rule and can't be switched off here.
        </p>
      </div>

      <Group title="Limits">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={ids.steps} className="text-sm font-medium">
              Step limit
            </label>
            <span className="tabular text-sm font-semibold text-signal">{steps}</span>
          </div>
          <input
            id={ids.steps}
            type="range"
            min={minSteps}
            max={maxSteps}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            onPointerUp={() => steps !== settings.max_steps && onSettings({ max_steps: steps })}
            onKeyUp={() => steps !== settings.max_steps && onSettings({ max_steps: steps })}
            onBlur={() => steps !== settings.max_steps && onSettings({ max_steps: steps })}
            className="mt-2 w-full accent-(--signal)"
          />
          <div className="flex justify-between text-xs text-faint tabular">
            <span>{minSteps}</span>
            <span>{maxSteps}</span>
          </div>
        </div>
        <div>
          <label htmlFor={ids.budget} className="text-sm font-medium">
            Budget cap (USD)
          </label>
          <div className="mt-1.5 flex items-center rounded-lg border border-rule bg-panel focus-within:outline-2 focus-within:outline-signal">
            <span className="pl-3 text-sm text-muted">$</span>
            <input
              id={ids.budget}
              inputMode="decimal"
              value={budget}
              aria-invalid={budgetError !== ""}
              aria-describedby={ids.budgetHelp}
              onChange={(e) => setBudget(e.target.value)}
              onBlur={commitBudget}
              onKeyDown={(e) => e.key === "Enter" && commitBudget()}
              className="tabular h-10 w-full bg-transparent px-2 text-sm outline-none"
            />
          </div>
          <p id={ids.budgetHelp} className={`mt-1 text-xs ${budgetError ? "text-stop" : "text-faint"}`}>
            {budgetError || "The run stops if the cost goes over this."}
          </p>
        </div>
      </Group>

      <Group title="Untrusted data">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Label notes as untrusted</p>
            <p className="mt-0.5 text-xs text-muted">
              Wraps notes in tags and tells the model they're data, not instructions. Turn off to compare.
            </p>
          </div>
          <Switch
            checked={settings.label_untrusted}
            onChange={(v) => onSettings({ label_untrusted: v })}
            label="Label notes as untrusted"
          />
        </div>
      </Group>

      <Group title="This run">
        <Meter
          label="Spent"
          value={money(state.total_cost)}
          total={`$${settings.budget.toFixed(4)}`}
          fraction={settings.budget > 0 ? state.total_cost / settings.budget : 1}
        />
        <Meter
          label="Steps"
          value={String(state.step_count)}
          total={String(settings.max_steps)}
          fraction={state.step_count / settings.max_steps}
        />
      </Group>

      <Group title="Controls">
        <Button variant="danger" className="w-full" onClick={onStop} disabled={!running}>
          <OctagonX className="size-4" aria-hidden /> Stop agent
        </Button>
        <Button className="w-full" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden /> Reset list and log
        </Button>
        {config && (
          <p className="text-xs text-faint">
            Model {config.model}. Cost uses peak prices (${config.price_input_per_m.toFixed(2)} in, ${config.price_output_per_m.toFixed(2)}{" "}
            out per 1M tokens), so real spend is the same or lower.
          </p>
        )}
      </Group>
    </Card>
  );
}
