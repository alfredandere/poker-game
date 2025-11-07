import os
import psycopg2
from psycopg2.extensions import connection as Connection
from typing import Optional


_connection: Optional[Connection] = None


def get_db_connection() -> Connection:
    """Get database connection."""
    global _connection
    
    if _connection is None or _connection.closed:
        database_url = os.getenv(
            "DATABASE_URL", 
            "postgresql://poker_user:poker_pass@postgres:5432/poker_db"
        )
        _connection = psycopg2.connect(database_url)
    
    return _connection


def close_db_connection():
    """Close database connection."""
    global _connection
    if _connection is not None and not _connection.closed:
        _connection.close()
        _connection = None


def init_db():
    """Initialize database tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table should be created by init.sql, but we ensure it exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hands (
            id UUID PRIMARY KEY,
            stacks JSONB NOT NULL,
            dealer_position INTEGER NOT NULL,
            small_blind_position INTEGER NOT NULL,
            big_blind_position INTEGER NOT NULL,
            hole_cards JSONB NOT NULL,
            actions TEXT NOT NULL,
            board_cards TEXT,
            payoffs JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_hands_created_at ON hands(created_at DESC)
    """)
    
    conn.commit()
    cursor.close()