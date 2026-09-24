// Shapes of the JSON the Python server sends (see engine.py: snapshot() and build_report()).

export type Status = "idle" | "running" | "waiting_approval" | "finished" | "stopped";
export type LogKind = "step" | "stop" | "block" | "wait" | "ok" | "info";
export type Action = "add" | "complete" | "delete" | "finish";

export interface Task {
  name: string;
  done: boolean;
  locked: boolean;
  notes: string;
}

export interface LogEntry {
  kind: LogKind;
  text: string;
  step: number | null;
  action: Action | null;
  task: string | null;
  reason: string | null;
  cost: number | null;
}

export interface PendingDelete {
  step: number;
  action: Action;
  task: string;
  reason: string;
}

export interface Settings {
  max_steps: number;
  budget: number;
  label_untrusted: boolean;
}

export interface Report {
  generated_at: string;
  user_task: string;
  outcome: "finished" | "stopped";
  end_reason: string;
  steps_taken: number;
  step_limit: number;
  total_cost_usd: number;
  budget_usd: number;
  budget_used_percent: number | null;
  actions_by_type: Record<Action, number>;
  approvals: number;
  rejections: number;
  blocked_actions: Record<"hard rule" | "duplicate" | "canary", number>;
  safeguards_fired: string[];
  notes_labelled_untrusted: boolean;
  resumed: boolean;
}

export interface SavedRun {
  goal: string;
  step_count: number;
  total_cost: number;
  status: "running" | "waiting_approval";
}

export interface AgentState {
  status: Status;
  goal: string;
  todos: Task[];
  log: LogEntry[];
  step_count: number;
  total_cost: number;
  pending_delete: PendingDelete | null;
  canary_triggered: boolean;
  safeguards_fired: string[];
  resumed: boolean;
  end_message: string;
  settings: Settings;
  report: Report | null;
  saved_run: SavedRun | null;
}

export interface Config {
  model: string;
  has_api_key: boolean;
  price_input_per_m: number;
  price_output_per_m: number;
  loop_repeat_limit: number;
  max_steps_range: [number, number];
}
