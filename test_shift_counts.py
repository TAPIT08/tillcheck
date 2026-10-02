from database import get_connection


def main():

    connection = get_connection()

    cursor = connection.cursor()

    rows = cursor.execute(
        """
        SELECT
            shifts.id AS shift_id,
            shifts.shift_name,
            shifts.status,
            cash_counts.id AS cash_count_id,
            cash_counts.count_type,
            cash_counts.actual_cash,
            cash_counts.created_at

        FROM shifts

        LEFT JOIN cash_counts
            ON cash_counts.shift_id = shifts.id

        ORDER BY shifts.id DESC,
                 cash_counts.id DESC
        """
    ).fetchall()

    print("Shift → Cash Count Relationship")
    print("--------------------------------")

    for row in rows:

        print(
            "Shift ID:",
            row["shift_id"]
        )

        print(
            "Shift:",
            row["shift_name"]
        )

        print(
            "Status:",
            row["status"]
        )

        print(
            "Cash Count ID:",
            row["cash_count_id"]
        )

        print(
            "Count Type:",
            row["count_type"]
        )

        print(
            "Actual Cash:",
            row["actual_cash"]
        )

        print(
            "Created:",
            row["created_at"]
        )

        print()

    connection.close()


if __name__ == "__main__":
    main()