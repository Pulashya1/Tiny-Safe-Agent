import type { AgentState, Config, Settings } from "./types";

// A tiny typed client for the Python API. Every action returns the new state.
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") message = data.detail;
    } catch {
      // Not JSON - keep the generic message.
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  config: () => request<Config>("GET", "/config"),
  state: () => request<AgentState>("GET", "/state"),
  run: (goal: string) => request<AgentState>("POST", "/run", { goal }),
  stop: () => request<AgentState>("POST", "/stop"),
  reset: () => request<AgentState>("POST", "/reset"),
  approve: () => request<AgentState>("POST", "/approve"),
  reject: () => request<AgentState>("POST", "/reject"),
  resume: () => request<AgentState>("POST", "/resume"),
  discard: () => request<AgentState>("POST", "/discard"),
  settings: (s: Partial<Settings>) => request<AgentState>("PUT", "/settings", s),
  lock: (name: string, locked: boolean) => request<AgentState>("PUT", "/tasks/lock", { name, locked }),
  addTask: (name: string, notes: string) => request<AgentState>("POST", "/tasks", { name, notes }),
};
