from pydantic import BaseModel

class PeriodEntry(BaseModel):
    start_date: str  # YYYY-MM-DD
    cycle_length: int