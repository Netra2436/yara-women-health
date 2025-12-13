import sqlite3

def get_connection():
    conn = sqlite3.connect("periods.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS periods (
                id INTEGER PRIMARY KEY,
                start_date TEXT NOT NULL,
                cycle_length INTEGER NOT NULL
            );
        """)