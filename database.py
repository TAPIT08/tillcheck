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

    # --------------------------------------------------
    # USERS
    # --------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            role TEXT NOT NULL DEFAULT 'staff',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
        """
    )

    # --------------------------------------------------
    # SHIFTS
    # --------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS shifts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            register_id INTEGER,

            shift_name TEXT,

            started_at TIMESTAMP,

            ended_at TIMESTAMP,

            status TEXT NOT NULL DEFAULT 'open',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(id)

        )
        """
    )

    # --------------------------------------------------
    # CASH COUNTS
    # --------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS cash_counts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            shift_id INTEGER,

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

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (shift_id)
                REFERENCES shifts(id)

        )
        """
    )

    # --------------------------------------------------
    # CASH DENOMINATIONS
    # --------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS cash_denominations (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            cash_count_id INTEGER NOT NULL,

            denomination REAL NOT NULL,

            quantity INTEGER NOT NULL DEFAULT 0,

            subtotal REAL NOT NULL DEFAULT 0,

            FOREIGN KEY (cash_count_id)
                REFERENCES cash_counts(id)

        )
        """
    )

    # --------------------------------------------------
    # CASH MOVEMENTS
    # --------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS cash_movements (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            cash_count_id INTEGER NOT NULL,

            movement_type TEXT NOT NULL,

            amount REAL NOT NULL,

            reason TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (cash_count_id)
                REFERENCES cash_counts(id)

        )
        """
    )

    connection.commit()

    connection.close()


if __name__ == "__main__":
    initialize_database()