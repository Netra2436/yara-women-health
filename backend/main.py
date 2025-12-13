from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import PeriodEntry
from database import get_connection, init_db
from datetime import date, timedelta

app = FastAPI(title="YARA Cycle Tracker")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/periods")
def log_period(entry: PeriodEntry):
    with get_connection() as conn:
        conn.execute("INSERT INTO periods (start_date, cycle_length) VALUES (?, ?)", (entry.start_date, entry.cycle_length))
    return {"message": "Logged"}

@app.get("/history")
def get_all():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM periods ORDER BY start_date DESC").fetchall()
        return [dict(r) for r in rows]

@app.get("/summary")
def summary():
    with get_connection() as conn:
        last = conn.execute("SELECT * FROM periods ORDER BY start_date DESC LIMIT 1").fetchone()
        if not last:
            raise HTTPException(status_code=404, detail="No data")
        
        start = date.fromisoformat(last["start_date"])
        length = last["cycle_length"]
        today = date.today()
        delta = (today - start).days % length

        if delta <= 4:
            phase = "Menstrual Phase 🩸"
        elif delta <= 13:
            phase = "Follicular Phase 🌱"
        elif delta <= 16:
            phase = "Ovulation Phase 💧"
        else:
            phase = "Luteal Phase 🌙"

        next_period = start + timedelta(days=length)
        while next_period < today:
            next_period += timedelta(days=length)

        return {
            "next_period": next_period.isoformat(),
            "current_phase": phase
        }