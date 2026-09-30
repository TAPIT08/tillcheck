import sqlite3
from pathlib import Path


DATABASE_DIR = Path(__file__).resolve().parent / "database"

DATABASE_PATH = DATABASE_DIR / "tillcheck.db"


def get_connection():
    DATABASE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS shifts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            count_type TEXT NOT NULL,

            starting_cash REAL NOT NULL DEFAULT 0,

            cash_sales REAL NOT NULL DEFAULT 0,

            cash_in REAL NOT NULL DEFAULT 0,

            cash_out REAL NOT NULL DEFAULT 0,

            expected_cash REAL NOT NULL DEFAULT 0,

            actual_cash REAL NOT NULL DEFAULT 0,

            remaining_cash REAL NOT NULL DEFAULT 0,

            remit REAL NOT NULL DEFAULT 0,

            difference REAL NOT NULL DEFAULT 0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
        """
    )


    connection.commit()

    connection.close()


if __name__ == "__main__":
    initialize_database()