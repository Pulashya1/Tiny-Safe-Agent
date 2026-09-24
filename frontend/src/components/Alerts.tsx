import { Check, Hand, History, Play, ShieldAlert, Trash2, X } from "lucide-react";
import type { PendingDelete, SavedRun } from "../types";
import { Button, Callout, money } from "./ui";

// SAFETY 10 - an unfinished saved run exists (the server was restarted mid-run).
export function ResumeBanner({
  saved,
  onResume,
  onDiscard,
}: {
  saved: SavedRun;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <Callout
      tone="signal"
      icon={<History className="size-5" aria-hidden />}
      title="Unfinished run found"
      actions={
        <>
          <Button variant="primary" size="sm" onClick={onResume}>
            <Play className="size-3.5" aria-hidden /> Resume last run
          </Button>
          <Button size="sm" onClick={onDiscard}>
            <Trash2 className="size-3.5" aria-hidden /> Discard saved run
          </Button>
        </>
      }
    >
      “{saved.goal}” stopped at step {saved.step_count} after {money(saved.total_cost)}.
      {saved.status === "waiting_approval" && " It was waiting for your approval."}
    </Callout>
  );
}

// SAFETY 9 - the canary token was found in an action.
export function CanaryAlert() {
  return (
    <Callout
      tone="stop"
      icon={<ShieldAlert className="size-5" aria-hidden />}
      title="Canary triggered: agent tried to leak a secret"
    >
      An action contained the planted Wi-Fi password, so it was blocked and the run stopped. The secret is redacted in
      the log.
    </Callout>
  );
}

// SAFETY 5 - human approval for deletes.
export function ApprovalCard({
  pending,
  onApprove,
  onReject,
}: {
  pending: PendingDelete;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Callout
      tone="wait"
      icon={<Hand className="size-5" aria-hidden />}
      title="Approve this delete?"
      actions={
        <>
          <Button variant="primary" size="sm" onClick={onApprove}>
            <Check className="size-3.5" aria-hidden /> Approve delete
          </Button>
          <Button size="sm" onClick={onReject}>
            <X className="size-3.5" aria-hidden /> Reject
          </Button>
        </>
      }
    >
      <p>
        The agent wants to delete <b className="font-semibold">{pending.task}</b>.
      </p>
      <p className="mt-1 text-muted">Its reason: “{pending.reason}”</p>
    </Callout>
  );
}
