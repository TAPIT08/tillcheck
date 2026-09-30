from database import get_connection


def main():

    connection = get_connection()

    cursor = connection.cursor()

    cash_count = cursor.execute(
        """
        SELECT *
        FROM cash_counts
        ORDER BY id DESC
        LIMIT 1
        """
    ).fetchone()

    if cash_count is None:

        print("No cash count found.")

        connection.close()

        return

    print("Latest Cash Count")
    print("------------------")

    print(
        "ID:",
        cash_count["id"]
    )

    print(
        "Count Type:",
        cash_count["count_type"]
    )

    print(
        "Starting Cash:",
        cash_count["starting_cash"]
    )

    print(
        "Cash Sales:",
        cash_count["cash_sales"]
    )

    print(
        "Cash In:",
        cash_count["cash_in"]
    )

    print(
        "Cash Out:",
        cash_count["cash_out"]
    )

    print(
        "Expected Cash:",
        cash_count["expected_cash"]
    )

    print(
        "Actual Cash:",
        cash_count["actual_cash"]
    )

    print(
        "Remaining Cash:",
        cash_count["remaining_cash"]
    )

    print(
        "Remit:",
        cash_count["remit"]
    )

    print(
        "Difference:",
        cash_count["difference"]
    )

    cash_count_id = cash_count["id"]

    print()
    print("Denominations")
    print("-------------")

    denominations = cursor.execute(
        """
        SELECT
            denomination,
            quantity,
            subtotal
        FROM cash_denominations
        WHERE cash_count_id = ?
        ORDER BY denomination DESC
        """,
        (cash_count_id,)
    ).fetchall()

    for denomination in denominations:

        print(
            denomination["denomination"],
            "x",
            denomination["quantity"],
            "=",
            denomination["subtotal"]
        )

    print()
    print("Cash Movements")
    print("--------------")

    movements = cursor.execute(
        """
        SELECT
            movement_type,
            amount,
            reason
        FROM cash_movements
        WHERE cash_count_id = ?
        ORDER BY id
        """,
        (cash_count_id,)
    ).fetchall()

    for movement in movements:

        print(
            movement["movement_type"],
            movement["amount"],
            movement["reason"]
        )

    connection.close()


if __name__ == "__main__":
    main()