from database import get_connection


def main():

    connection = get_connection()
    cursor = connection.cursor()

    # --------------------------------------------------
    # CREATE USER
    # --------------------------------------------------

    cursor.execute(
        """
        INSERT INTO users (
            name,
            role
        )
        VALUES (?, ?)
        """,
        (
            "Test Cashier",
            "staff"
        )
    )

    user_id = cursor.lastrowid

    # --------------------------------------------------
    # CREATE SHIFT
    # --------------------------------------------------

    cursor.execute(
        """
        INSERT INTO shifts (
            user_id,
            shift_name,
            started_at,
            status
        )
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
        """,
        (
            user_id,
            "Morning Shift",
            "open"
        )
    )

    shift_id = cursor.lastrowid

    # --------------------------------------------------
    # CREATE OPENING COUNT
    # --------------------------------------------------

    starting_cash = 4000

    cursor.execute(
        """
        INSERT INTO cash_counts (
            shift_id,
            count_type,
            starting_cash,
            expected_cash,
            actual_cash,
            remaining_cash,
            remit,
            difference
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            shift_id,
            "opening",
            starting_cash,
            starting_cash,
            starting_cash,
            starting_cash,
            0,
            0
        )
    )

    cash_count_id = cursor.lastrowid

    # --------------------------------------------------
    # ADD DENOMINATIONS
    # --------------------------------------------------

    denominations = [
        (1000, 2),
        (500, 2),
        (200, 3),
        (100, 1),
        (50, 2),
        (20, 2),
        (10, 2),
        (5, 2),
        (1, 5),
    ]

    for denomination, quantity in denominations:

        subtotal = denomination * quantity

        cursor.execute(
            """
            INSERT INTO cash_denominations (
                cash_count_id,
                denomination,
                quantity,
                subtotal
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                cash_count_id,
                denomination,
                quantity,
                subtotal
            )
        )

    # --------------------------------------------------
    # ADD CASH MOVEMENT
    # --------------------------------------------------

    cursor.execute(
        """
        INSERT INTO cash_movements (
            cash_count_id,
            movement_type,
            amount,
            reason
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            cash_count_id,
            "in",
            500,
            "Test cash replenishment"
        )
    )

    connection.commit()

    # --------------------------------------------------
    # READ USER
    # --------------------------------------------------

    print()
    print("========== USER ==========")

    user = cursor.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    print("ID:", user["id"])
    print("Name:", user["name"])
    print("Role:", user["role"])

    # --------------------------------------------------
    # READ SHIFT
    # --------------------------------------------------

    print()
    print("========== SHIFT ==========")

    shift = cursor.execute(
        """
        SELECT *
        FROM shifts
        WHERE id = ?
        """,
        (shift_id,)
    ).fetchone()

    print("ID:", shift["id"])
    print("Shift:", shift["shift_name"])
    print("Status:", shift["status"])

    # --------------------------------------------------
    # READ CASH COUNT
    # --------------------------------------------------

    print()
    print("========== CASH COUNT ==========")

    cash_count = cursor.execute(
        """
        SELECT *
        FROM cash_counts
        WHERE id = ?
        """,
        (cash_count_id,)
    ).fetchone()

    print("ID:", cash_count["id"])
    print("Type:", cash_count["count_type"])
    print("Starting Cash:", cash_count["starting_cash"])
    print("Expected Cash:", cash_count["expected_cash"])
    print("Actual Cash:", cash_count["actual_cash"])
    print("Remaining Cash:", cash_count["remaining_cash"])
    print("Remit:", cash_count["remit"])
    print("Difference:", cash_count["difference"])

    # --------------------------------------------------
    # READ DENOMINATIONS
    # --------------------------------------------------

    print()
    print("========== DENOMINATIONS ==========")

    denomination_rows = cursor.execute(
        """
        SELECT *
        FROM cash_denominations
        WHERE cash_count_id = ?
        ORDER BY denomination DESC
        """,
        (cash_count_id,)
    ).fetchall()

    for row in denomination_rows:

        print(
            f"₱{row['denomination']:.2f}"
            f" × {row['quantity']}"
            f" = ₱{row['subtotal']:.2f}"
        )

    # --------------------------------------------------
    # READ CASH MOVEMENTS
    # --------------------------------------------------

    print()
    print("========== CASH MOVEMENTS ==========")

    movement_rows = cursor.execute(
        """
        SELECT *
        FROM cash_movements
        WHERE cash_count_id = ?
        """,
        (cash_count_id,)
    ).fetchall()

    for row in movement_rows:

        print(
            f"{row['movement_type'].upper()}"
            f" | ₱{row['amount']:.2f}"
            f" | {row['reason']}"
        )

    connection.close()


if __name__ == "__main__":
    main()