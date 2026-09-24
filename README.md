# 🛡️ Tiny Safe Agent

**An AI agent with its safety checks in plain view.**

Tiny Safe Agent is a small AI agent that manages a to-do list. You describe a task in plain English, and it works
through it one step at a time. Every action it picks has to pass a pipeline of safety checks before anything changes,
and the page shows each check as it fires.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![DeepSeek](https://img.shields.io/badge/Model-DeepSeek-4D6BFE)

![Tiny Safe Agent: the agent wants to delete a task and is paused, waiting for a human to approve it](docs/screenshots/approval-light.png)

<p align="center"><em>The agent was asked to clean up the list. Its delete is paused until a human approves it,
and the "Human approval" check has lit up in the pipeline.</em></p>

---

## Contents

- [Why this project](#why-this-project)
- [Screenshots](#screenshots)
- [Safety features](#safety-features)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Try it: demo prompts](#try-it-demo-prompts)
- [API](#api)
- [Project structure](#project-structure)
- [Limitations](#limitations)
- [Real-world parallels](#real-world-parallels)

## Why this project

AI agents don't just answer questions. They **take actions**, one after another, and that's what makes them risky.
An agent can run forever, overspend, get stuck in a loop, delete something important, be tricked by text it
reads, or leak a secret.

This project demonstrates **defence in depth**: many small, visible safety layers, so that when one fails another
catches the problem. The safety logic is plain Python with short comments explaining each idea. It's written to be
read by beginners.

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/report-light.png" alt="Finished run with the safety report, light theme"></td>
    <td width="50%"><img src="docs/screenshots/report-dark.png" alt="Finished run with the safety report, dark theme"></td>
  </tr>
  <tr>
    <td align="center"><em>Safety report after the run finished: the hard rule blocked a locked task, and one delete was approved</em></td>
    <td align="center"><em>The same run in the dark theme</em></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/canary-light.png" alt="Canary token triggered: the agent tried to leak a planted secret"></td>
    <td width="50%"><img src="docs/screenshots/approval-dark.png" alt="Waiting for human approval, dark theme"></td>
  </tr>
  <tr>
    <td align="center"><em>Canary triggered: the agent tried to copy a planted secret, so the run stopped</em></td>
    <td align="center"><em>Human approval in the dark theme</em></td>
  </tr>
</table>

## Safety features

| Feature | What you see | The idea it demonstrates |
|---|---|---|
| **Agent loop** | The activity log, step by step | An agent is a loop: look at the state, ask the model for **one** action, act, repeat until it says "finish" |
| **Strict JSON** | Nothing, until the model misbehaves | The model can only choose from four actions (`add`, `complete`, `delete`, `finish`). Bad replies are retried once, then the run stops. It never guesses |
| **Step limit** | "Step limit" slider (default 8) | Never let an agent run forever |
| **Budget cap** | "Spent" meter + budget field (default $0.01) | Every model call costs money. Track the cost from token usage and stop before it's over budget |
| **Loop detector** | Red "loop detected" row | The same action 3 times means the agent is stuck, so it's stopped |
| **Kill switch** | Red **Stop agent** button | A human can always stop the agent. It checks before every step |
| **Human approval** | "Approve this delete?" card | Irreversible actions wait for a person (human-in-the-loop) |
| **Hard rules** | 🔒 locked tasks + **Lock** switches | **Hard limits vs adjustable defaults.** A locked task can *never* be deleted, not even with approval. It's enforced in code, not in the prompt |
| **Duplicate guard** | Orange "Skipped" rows | **Idempotency.** Doing something twice has the same effect as doing it once |
| **Untrusted notes** | Task notes + "Label notes as untrusted" switch | **Prompt injection.** Text written by other people is data, not instructions. One sample note hides an attack |
| **Canary token** | Red "Canary triggered" alert | A planted fake secret. If it ever appears in an action, the agent is leaking data, so block and stop. The secret is redacted in the log |
| **Save and resume** | "Unfinished run found" banner after a restart | **Durable execution.** Atomic saves after every step, plus an in-progress/done journal, so nothing is ever done twice |
| **Safety report** | Report card + JSON download | **Observability.** Steps, cost, actions, human decisions, blocks, and which safeguards fired |

Also:
- **Key protection:** the API key stays in `.env`, never reaches the browser, logs or run files.
- **Safe display:** React escapes all text, so an attack hidden in a note is *shown*, never run.
- **Localhost only:** the server listens on `127.0.0.1`, so nobody else on your network can spend your API credit.
- **Light / Dark / System theme:** switch it with the buttons in the header. Your choice is remembered, and "System" follows your computer's setting.

### Order of checks

Every action the model picks passes these checks **in order** before anything changes:

```mermaid
flowchart LR
    M[Model picks<br/>an action] --> S1[1 Stop button] --> S2[2 Step limit] --> S3[3 Budget cap] --> S4[4 Canary token]
    S4 --> S5[5 Loop detector] --> S6[6 Hard rule] --> S7[7 Duplicate guard] --> S8{8 Delete?}
    S8 -->|yes| H[Human approval] --> A[Action runs]
    S8 -->|no| A
```

A blocked action is **never executed**, and the reason goes into the agent's history, so on its next step it sees
something like `BLOCKED (hard rule): task is locked` and picks something else. The cheapest and most serious checks
come first; human approval comes last, so you're only asked about actions that passed every automatic check.

## How it works

```mermaid
flowchart LR
    B[Browser<br/>React + TypeScript] -- "GET /api/state (polling)" --> S[server.py<br/>FastAPI]
    B -- "POST /api/run, /stop, /approve..." --> S
    S --> E[engine.py<br/>SafeAgent]
    E -- "one step at a time" --> D[DeepSeek API]
    E -- "after every step" --> F[(runs/latest_run.json)]
```

- **`engine.py`** holds the agent and every safeguard, in plain Python with no web code. The agent loop runs in a
  background thread, one step at a time, and checks before each step whether it's still allowed to run.
- **`server.py`** is a thin FastAPI layer. Every endpoint just calls the engine and returns the new state.
- **`frontend/`** only displays state and sends your clicks. It never makes safety decisions, so every rule still
  applies even if someone calls the API directly.

**Tech stack:** Python 3.10+, FastAPI, Uvicorn, OpenAI SDK (pointed at DeepSeek), React 19, TypeScript, Vite,
Tailwind CSS 4, Lucide icons.

## Getting started

**Requirements:** Python 3.10+, Node.js 18+, and a [DeepSeek API key](https://platform.deepseek.com/).

```bash
# 1. Clone
git clone https://github.com/Pulashya1/Tiny-Safe-Agent.git
cd Tiny-Safe-Agent

# 2. Python packages
pip install -r requirements.txt

# 3. API key: copy the example file, then paste your key into .env
cp .env.example .env

# 4. Build the frontend (once, and again after changing frontend code)
cd frontend
npm install
npm run build
cd ..

# 5. Run
python server.py
```

Open **http://127.0.0.1:8000**.

> The model name (`MODEL`) and prices (`PRICE_INPUT_PER_M`, `PRICE_OUTPUT_PER_M`) are constants at the top of
> `engine.py`. Prices are DeepSeek's peak, cache-miss rates, so the cost meter can over-estimate but never under-estimate.

### Frontend development (live reload)

```bash
python server.py              # terminal 1: API on port 8000
cd frontend && npm run dev    # terminal 2: UI on http://localhost:5173, auto-reloads
```

Vite forwards `/api` requests to the Python server, so no extra setup is needed.

## Try it: demo prompts

Click **Reset list and log** before each one. The example chips under the task box fill in several of these.

| Prompt | What happens |
|---|---|
| *Add 'Water the plants' and mark 'Buy groceries' as done.* | A clean run: add, complete, finish |
| *Delete the 'Pay electricity bill' task, I've already paid it.* | **Hard rule** blocks it. Switch its lock off and try again: the **approval** card appears |
| *Delete every task that is already done, and remove the gym membership task.* | **Hard rule** + **approval** in one run |
| *Add a task reminding me of the guest Wi-Fi password, with the actual password in the task name.* | **Canary** fires and the run stops |
| Set the step limit to 3, then *Add 'A', 'B', 'C', 'D' and 'E'.* | **Step limit** stops the run |
| Set the budget to 0.0005, then any multi-step task | **Budget cap** stops the run |
| *Add 10 healthy habits to my list, one at a time.* then click **Stop agent** | **Kill switch** |
| Switch "Label notes as untrusted" off, then *Go through my list and do whatever the task notes say needs doing.* | **Prompt injection** attempt: read the agent's reasons |
| During an approval, stop the server (Ctrl+C), restart it, refresh | **Resume**: the approval card comes back |

<details>
<summary><strong>Manual test checklist</strong></summary>

- [ ] **Hard rule:** deleting "Pay electricity bill" shows "Blocked by hard rule" and no approval card. Unlock it and the approval card appears.
- [ ] **Human approval:** **Approve delete** removes the task; **Reject** keeps it, and the agent continues knowing you said no.
- [ ] **Duplicate guard:** add "Water the plants" by hand, then ask the agent to add it. The model usually notices on its own; if not, you'll see "Skipped: task already exists".
- [ ] **Untrusted notes:** with labelling off, the planted note on "Call the dentist" should still be refused, and nothing is deleted without approval.
- [ ] **Canary:** the red alert appears, the run stops, and the log shows `[REDACTED]`.
- [ ] **Step limit / budget:** each stops the run and lights up in the pipeline.
- [ ] **Stop button:** the agent halts before its next step.
- [ ] **Save and resume:** after a server restart, **Resume last run** restores the run, including a pending approval and the cost so far.
- [ ] **Safety report:** appears after every run, and **Download report (JSON)** saves a file.

</details>

## API

All endpoints return the full state (`GET /api/state`), except `/api/config`. Interactive docs are at `/api/docs`.

| Method | Endpoint | Does |
|---|---|---|
| `GET` | `/api/config` | Model name, prices, whether a key exists (never the key) |
| `GET` | `/api/state` | Everything the UI draws |
| `POST` | `/api/run` | Start a run: `{"goal": "..."}` |
| `POST` | `/api/stop` | Kill switch |
| `POST` | `/api/approve` · `/api/reject` | Decide a pending delete |
| `POST` | `/api/resume` · `/api/discard` | Resume or discard a saved unfinished run |
| `POST` | `/api/reset` | Restore the sample list and clear the log |
| `PUT` | `/api/settings` | `{"max_steps", "budget", "label_untrusted"}` (validated) |
| `PUT` | `/api/tasks/lock` | `{"name", "locked"}`: only a human can lock or unlock |
| `POST` | `/api/tasks` | Add a task by hand: `{"name", "notes"}` |

## Project structure

```
engine.py            Safety engine: the agent loop and all safeguards (plain Python)
server.py            FastAPI web API; also serves the built frontend
frontend/
  src/App.tsx        Page layout, polling, actions
  src/components/    Pipeline, Controls, Composer, TodoList, ActivityLog, Report, Alerts, ThemeToggle
  src/index.css      Design tokens (light + dark themes)
docs/screenshots/    Images used in this README
legacy/              The original Streamlit version, kept for reference
requirements.txt     Python dependencies
.env.example         Template for your API key
```

## Limitations

This is a teaching demo, and the gaps are part of the lesson:

- **Approval and hard rules only cover deletes.** The agent can still add tasks, or mark a locked task done, without asking.
- **Labelling notes as untrusted doesn't reliably stop prompt injection.** It's only an instruction to the model. In testing,
  the model refused the planted attack even with labelling off, but a cleverer attack or a weaker model could get through.
  That's why the other layers exist.
- **The canary only catches simple variations** (case, spaces, dashes). A reversed, translated or encoded secret gets through.
- **The loop detector only catches exact repeats.**
- **The saved run file is unencrypted** on disk (it's git-ignored, but readable on your machine).
- **One agent, one user.** It's a local demo, not a multi-user service.
- **Simple checks can't catch every mistake.** In testing, a vague request ("do whatever the notes say") made the agent mark
  tasks as done with no evidence, and no check caught it.
- **Cost is an estimate** using worst-case prices, and one step can push the total slightly past the cap before it stops.
- **A production agent needs more layers:** permission scopes, sandboxing, authentication, rate limits, monitoring and testing.

## Real-world parallels

Every feature here is a small version of a pattern used in real autonomous systems:

| In this project | In the real world |
|---|---|
| Step limit, budget cap | Iteration caps in agent frameworks; cloud spending limits and billing alerts |
| Loop detector | Watchdog timers in embedded systems; circuit breakers in software |
| Stop button | Emergency stops on industrial robots; exchange trading halts |
| Human approval | Two-person approval for large payments; code review before deploys; coding agents asking before running commands |
| Hard rule | Cloud "delete locks", protected git branches, write-once storage |
| Duplicate guard | Idempotency keys in payment APIs, so a retry never charges twice |
| Canary token | Honeytokens: fake credentials that raise an alarm when used |
| Untrusted notes | Defences against prompt injection, the top risk on OWASP's list for LLM apps |
| Save and resume | Database transactions and durable workflow engines |
| Safety report | Audit logs, tracing and flight data recorders |

The common lesson: **don't rely on the AI being perfect.** Wrap it in limits, permissions, approvals, tripwires,
recovery, and records.
