"""
Tiny Safe Agent - web API
-------------------------
A thin FastAPI layer over the safety engine in engine.py. Every endpoint just calls
the engine and returns the latest state, so all safety logic stays in one place.

Run with:  python server.py        (then open http://127.0.0.1:8000)
"""

import os

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from engine import EngineError, SafeAgent, public_config

agent = SafeAgent()
app = FastAPI(title="Tiny Safe Agent", docs_url="/api/docs", openapi_url="/api/openapi.json")


# ----- Request bodies (FastAPI checks the types for us) -----
class RunRequest(BaseModel):
    goal: str = Field(max_length=500)


class SettingsRequest(BaseModel):
    max_steps: int | None = None
    budget: float | None = None
    label_untrusted: bool | None = None


class LockRequest(BaseModel):
    name: str
    locked: bool


class TaskRequest(BaseModel):
    name: str = Field(max_length=120)
    notes: str = Field(default="", max_length=1000)


def act(action, *args, **kwargs):
    """Run an engine action and return the new state. A refused action becomes a
    clear 409 error message for the UI (never a stack trace)."""
    try:
        action(*args, **kwargs)
    except EngineError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return agent.snapshot()


# ----- API -----
@app.get("/api/config")
def get_config():
    return public_config()


@app.get("/api/state")
def get_state():
    return agent.snapshot()


@app.post("/api/run")
def run(body: RunRequest):
    return act(agent.start_run, body.goal)


@app.post("/api/stop")
def stop():
    return act(agent.stop)


@app.post("/api/reset")
def reset():
    return act(agent.reset)


@app.post("/api/approve")
def approve():
    return act(agent.approve)


@app.post("/api/reject")
def reject():
    return act(agent.reject)


@app.post("/api/resume")
def resume():
    return act(agent.resume)


@app.post("/api/discard")
def discard():
    return act(agent.discard_saved_run)


@app.put("/api/settings")
def settings(body: SettingsRequest):
    return act(agent.update_settings, body.max_steps, body.budget, body.label_untrusted)


@app.put("/api/tasks/lock")
def lock_task(body: LockRequest):
    return act(agent.set_lock, body.name, body.locked)


@app.post("/api/tasks")
def add_task(body: TaskRequest):
    return act(agent.add_task, body.name, body.notes)


# ----- The built frontend (after `npm run build` in frontend/) -----
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file = os.path.normpath(os.path.join(DIST, path))
        if path and file.startswith(DIST) and os.path.isfile(file):
            return FileResponse(file)
        return FileResponse(os.path.join(DIST, "index.html"))


if __name__ == "__main__":
    # 127.0.0.1 = only this computer can reach the app (it holds your API key).
    uvicorn.run(app, host="127.0.0.1", port=8000)
