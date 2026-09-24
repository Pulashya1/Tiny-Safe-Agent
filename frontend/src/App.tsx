import { OctagonX, PlugZap, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { ActivityLog } from "./components/ActivityLog";
import { ApprovalCard, CanaryAlert, ResumeBanner } from "./components/Alerts";
import { Composer } from "./components/Composer";
import { Controls } from "./components/Controls";
import { Header } from "./components/Header";
import { Pipeline } from "./components/Pipeline";
import { SafetyReport } from "./components/Report";
import { AddTask, TodoList } from "./components/TodoList";
import { Button } from "./components/ui";
import type { AgentState, Config, Settings } from "./types";

type Toast = { id: number; text: string };

export default function App() {
  const [state, setState] = useState<AgentState | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [offline, setOffline] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Every request gets a number; an older reply never overwrites a newer one.
  const requestSeq = useRef(0);
  const appliedSeq = useRef(0);
  const statusRef = useRef<AgentState["status"]>("idle");
  const timer = useRef<number | undefined>(undefined);
  const pollRef = useRef<() => void>(() => {});

  const apply = useCallback((seq: number, s: AgentState) => {
    if (seq <= appliedSeq.current) return;
    appliedSeq.current = seq;
    statusRef.current = s.status;
    setState(s);
  }, []);

  // Poll the server: quickly while the agent works, slowly otherwise.
  useEffect(() => {
    let alive = true;
    async function poll() {
      window.clearTimeout(timer.current);
      const seq = ++requestSeq.current;
      try {
        const s = await api.state();
        if (!alive) return;
        apply(seq, s);
        setOffline(false);
      } catch {
        if (!alive) return;
        setOffline(true);
      }
      if (alive) timer.current = window.setTimeout(poll, statusRef.current === "running" ? 500 : 2000);
    }
    pollRef.current = () => void poll();
    void poll();
    return () => {
      alive = false;
      window.clearTimeout(timer.current);
    };
  }, [apply]);

  // Static facts (model name, whether a key exists). Retry until the server answers.
  useEffect(() => {
    if (config || offline) return;
    api.config().then(setConfig, () => undefined);
  }, [config, offline, state]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  // Send an action to the server, show the new state, and poll again right away.
  const perform = useCallback(
    async (call: () => Promise<AgentState>) => {
      const seq = ++requestSeq.current;
      try {
        apply(seq, await call());
        pollRef.current();
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Something went wrong.");
        return false;
      }
    },
    [apply, toast],
  );

  const busy = state?.status === "running" || state?.status === "waiting_approval";

  return (
    <div className="min-h-dvh">
      <Header state={state} model={config?.model} />

      {offline && (
        <div role="alert" className="border-b border-stop/30 bg-stop-soft">
          <p className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2.5 text-sm font-medium text-stop sm:px-6">
            <PlugZap className="size-4 shrink-0" aria-hidden />
            Can't reach the Python server. Start it with <code className="font-semibold">python server.py</code>.
          </p>
        </div>
      )}

      {!state ? (
        <p className="py-32 text-center text-sm text-muted">Connecting to the safety engine…</p>
      ) : (
        <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 pb-28 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:pb-10">
          <aside className="order-2 lg:sticky lg:top-22 lg:order-1 lg:self-start">
            <Controls
              state={state}
              config={config}
              onSettings={(s: Partial<Settings>) => void perform(() => api.settings(s))}
              onStop={() => void perform(api.stop)}
              onReset={() => void perform(api.reset)}
            />
          </aside>

          <div className="order-1 min-w-0 space-y-6 lg:order-2">
            <Pipeline firedNames={state.safeguards_fired} />

            <div className="grid items-start gap-6 xl:grid-cols-2">
              <div className="min-w-0 space-y-6">
                <Composer
                  busy={busy}
                  hasKey={config?.has_api_key ?? true}
                  onRun={(goal) => perform(() => api.run(goal))}
                />
                <TodoList todos={state.todos} onLock={(name, locked) => void perform(() => api.lock(name, locked))} />
                <AddTask disabled={busy} onAdd={(name, notes) => perform(() => api.addTask(name, notes))} />
              </div>

              <div className="min-w-0 space-y-6">
                {state.saved_run && (
                  <ResumeBanner
                    saved={state.saved_run}
                    onResume={() => void perform(api.resume)}
                    onDiscard={() => void perform(api.discard)}
                  />
                )}
                {state.canary_triggered && <CanaryAlert />}
                {state.pending_delete && (
                  <ApprovalCard
                    pending={state.pending_delete}
                    onApprove={() => void perform(api.approve)}
                    onReject={() => void perform(api.reject)}
                  />
                )}
                {state.report && <SafetyReport report={state.report} />}
                <ActivityLog state={state} />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* On small screens the Stop button stays within reach while the agent works. */}
      {busy && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel/95 p-3 backdrop-blur lg:hidden">
          <Button variant="danger" className="w-full" onClick={() => void perform(api.stop)}>
            <OctagonX className="size-4" aria-hidden /> Stop agent
          </Button>
        </div>
      )}

      <div className="fixed right-4 bottom-20 z-40 lg:bottom-4 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="assertive">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-rule bg-panel p-3.5 text-sm shadow-lg"
          >
            <span className="min-w-0 flex-1">{t.text}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              className="rounded text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
