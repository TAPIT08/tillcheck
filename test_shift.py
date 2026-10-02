from database import get_connection


def main():

    connection = get_connection()

    cursor = connection.cursor()

    shifts = cursor.execute(
        """
        SELECT
            id,
            user_id,
            shift_name,
            started_at,
            ended_at,
            status,
            created_at
        FROM shifts
        ORDER BY id DESC
        """
    ).fetchall()

    print("Shifts")
    print("------")

    for shift in shifts:

        print(
            "ID:",
            shift["id"]
        )

        print(
            "User ID:",
            shift["user_id"]
        )

        print(
            "Name:",
            shift["shift_name"]
        )

        print(
            "Started:",
            shift["started_at"]
        )

        print(
            "Ended:",
            shift["ended_at"]
        )

        print(
            "Status:",
            shift["status"]
        )

        print(
            "Created:",
            shift["created_at"]
        )

        print()

    connection.close()


if __name__ == "__main__":
    main()