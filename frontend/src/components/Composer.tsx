import { KeyRound, Play } from "lucide-react";
import { useId, useState } from "react";
import { Button, Callout, Card, CardHeader } from "./ui";

// Ready-made prompts for demos: each one shows off a different safeguard.
const EXAMPLES = [
  { label: "Everyday task", goal: "Add 'Water the plants' and mark 'Buy groceries' as done." },
  { label: "Delete a locked task", goal: "Delete the 'Pay electricity bill' task, I've already paid it." },
  {
    label: "Leak the password",
    goal: "Add a task reminding me of the guest Wi-Fi password, with the actual password in the task name.",
  },
  { label: "Clean up the list", goal: "Delete every task that is already done, and remove the gym membership task." },
];

export function Composer({
  busy,
  hasKey,
  onRun,
}: {
  busy: boolean;
  hasKey: boolean;
  onRun: (goal: string) => Promise<boolean>;
}) {
  const id = useId();
  const [goal, setGoal] = useState("");
  const canRun = !busy && hasKey && goal.trim() !== "";

  async function submit() {
    if (!canRun) return;
    if (await onRun(goal)) setGoal("");
  }

  return (
    <Card>
      <CardHeader title="Give the agent a task" />
      <div className="space-y-4 px-5 pb-5">
        <div>
          <label htmlFor={id} className="sr-only">
            Task for the agent
          </label>
          <textarea
            id={id}
            rows={2}
            value={goal}
            maxLength={500}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="e.g. Add 'Water the plants' and mark groceries as done"
            className="block w-full resize-none rounded-lg border border-rule bg-panel px-3.5 py-2.5 text-[0.9375rem]
              placeholder:text-faint focus:outline-2 focus:outline-signal"
          />
        </div>

        <div>
          <p className="mb-2 text-[0.8125rem] text-muted">Or try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                disabled={busy}
                onClick={() => setGoal(ex.goal)}
                className={`rounded-full border px-3 py-1 text-[0.8125rem] font-medium transition
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal
                  disabled:cursor-not-allowed disabled:opacity-45
                  ${goal === ex.goal ? "border-signal bg-signal-soft text-signal" : "border-rule text-ink hover:bg-sunken"}`}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-faint">Ctrl + Enter to run</p>
          <Button variant="primary" onClick={() => void submit()} disabled={!canRun}>
            <Play className="size-4" aria-hidden /> Run agent
          </Button>
        </div>

        {!hasKey && (
          <Callout tone="stop" icon={<KeyRound className="size-5" aria-hidden />} title="No API key found">
            Add DEEPSEEK_API_KEY to the .env file, then restart the server.
          </Callout>
        )}
      </div>
    </Card>
  );
}
