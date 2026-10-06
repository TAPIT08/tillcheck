from flask import (
    Blueprint,
    render_template,
    request,
    jsonify
)

from database import get_connection


main = Blueprint(
    "main",
    __name__
)


@main.route("/")
def home():

    return cash_count()


@main.route("/cash-count")
def cash_count():

    connection = get_connection()

    cursor = connection.cursor()

    current_shift = cursor.execute(
        """
        SELECT
            id,
            shift_name,
            started_at,
            status
        FROM shifts
        WHERE status = 'open'
        ORDER BY id DESC
        LIMIT 1
        """
    ).fetchone()

    connection.close()

    return render_template(
        "cash_count.html",
        current_shift=current_shift
    )


@main.route("/database-test")
def database_test():

    connection = get_connection()

    cursor = connection.cursor()

    tables = cursor.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
        """
    ).fetchall()

    connection.close()

    table_names = [
        table["name"]
        for table in tables
    ]

    return {
        "database": "connected",
        "tables": table_names
    }


@main.route(
    "/save-cash-count",
    methods=["POST"]
)
def save_cash_count():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received."
        }), 400

    connection = get_connection()

    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO cash_counts (

                shift_id,
                count_type,
                starting_cash,
                cash_sales,
                cash_in,
                cash_out,
                expected_cash,
                actual_cash,
                remaining_cash,
                remit,
                difference

            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.get("shift_id"),
                data.get("count_type"),
                data.get("starting_cash", 0),
                data.get("cash_sales", 0),
                data.get("cash_in", 0),
                data.get("cash_out", 0),
                data.get("expected_cash", 0),
                data.get("actual_cash", 0),
                data.get("remaining_cash", 0),
                data.get("remit", 0),
                data.get("difference", 0)
            )
        )

        cash_count_id = cursor.lastrowid

        denominations = data.get(
            "denominations",
            []
        )

        for denomination in denominations:

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
                    denomination.get(
                        "denomination",
                        0
                    ),
                    denomination.get(
                        "quantity",
                        0
                    ),
                    denomination.get(
                        "subtotal",
                        0
                    )
                )
            )

        movements = data.get(
            "movements",
            []
        )

        for movement in movements:

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
                    movement.get(
                        "type"
                    ),
                    movement.get(
                        "amount",
                        0
                    ),
                    movement.get(
                        "reason",
                        ""
                    )
                )
            )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Cash count saved successfully.",
            "cash_count_id": cash_count_id
        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        connection.close()
        

@main.route("/cash-counts")
def cash_counts():

    connection = get_connection()

    cursor = connection.cursor()

    cash_counts = cursor.execute(
        """
        SELECT
            id,
            count_type,
            starting_cash,
            cash_sales,
            cash_in,
            cash_out,
            expected_cash,
            actual_cash,
            remaining_cash,
            remit,
            difference,
            created_at
        FROM cash_counts
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    return render_template(
        "cash_counts.html",
        cash_counts=cash_counts
    )

@main.route("/cash-count/<int:cash_count_id>")
def cash_count_detail(cash_count_id):

    connection = get_connection()

    cursor = connection.cursor()

    cash_count = cursor.execute(
        """
        SELECT *
        FROM cash_counts
        WHERE id = ?
        """,
        (cash_count_id,)
    ).fetchone()

    if cash_count is None:

        connection.close()

        return "Cash count not found.", 404

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

    movements = cursor.execute(
        """
        SELECT
            movement_type,
            amount,
            reason,
            created_at
        FROM cash_movements
        WHERE cash_count_id = ?
        ORDER BY id
        """,
        (cash_count_id,)
    ).fetchall()

    connection.close()

    return render_template(
        "cash_count_detail.html",
        cash_count=cash_count,
        denominations=denominations,
        movements=movements
    )

@main.route(
    "/create-shift",
    methods=["POST"]
)
def create_shift():

    data = request.get_json() or {}

    user_id = data.get("user_id")
    shift_name = data.get(
        "shift_name",
        "Test Shift"
    )

    connection = get_connection()

    cursor = connection.cursor()

    try:

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
                shift_name,
                "open"
            )
        )

        shift_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "success": True,
            "shift_id": shift_id,
            "message": "Shift created successfully."
        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        connection.close()

@main.route("/shifts")
def shifts():

    connection = get_connection()

    cursor = connection.cursor()

    current_shift = cursor.execute(
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
        WHERE status = 'open'
        ORDER BY id DESC
        LIMIT 1
        """
    ).fetchone()

    connection.close()

    return render_template(
        "shifts.html",
        current_shift=current_shift
    )


@main.route(
    "/open-shift",
    methods=["POST"]
)
def open_shift():

    data = request.get_json() or {}

    shift_name = data.get(
        "shift_name",
        "New Shift"
    )

    connection = get_connection()

    cursor = connection.cursor()

    try:

        existing_shift = cursor.execute(
            """
            SELECT id
            FROM shifts
            WHERE status = 'open'
            LIMIT 1
            """
        ).fetchone()

        if existing_shift:

            return jsonify({
                "success": False,
                "message":
                    "There is already an open shift."
            }), 400

        cursor.execute(
            """
            INSERT INTO shifts (
                shift_name,
                started_at,
                status
            )
            VALUES (?, CURRENT_TIMESTAMP, ?)
            """,
            (
                shift_name,
                "open"
            )
        )

        shift_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "success": True,
            "shift_id": shift_id,
            "message":
                "Shift opened successfully."
        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        connection.close()


@main.route(
    "/close-shift/<int:shift_id>",
    methods=["POST"]
)
def close_shift(shift_id):

    connection = get_connection()

    cursor = connection.cursor()

    try:

        shift = cursor.execute(
            """
            SELECT id, status
            FROM shifts
            WHERE id = ?
            """,
            (shift_id,)
        ).fetchone()

        if shift is None:

            return jsonify({
                "success": False,
                "message": "Shift not found."
            }), 404

        if shift["status"] != "open":

            return jsonify({
                "success": False,
                "message":
                    "This shift is already closed."
            }), 400

        cursor.execute(
            """
            UPDATE shifts

            SET
                status = 'closed',
                ended_at = CURRENT_TIMESTAMP

            WHERE id = ?
            """,
            (shift_id,)
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message":
                "Shift closed successfully."
        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        connection.close()

@main.route("/shift-test")
def shift_test():

    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>TillCheck Shift Test</title>
    </head>

    <body>

        <h1>Create Test Shift</h1>

        <input
            id="shift-name"
            type="text"
            value="Morning Shift"
        >

        <button
            id="create-shift-button"
        >
            Create Shift
        </button>

        <p id="status"></p>

        <script>

            const button =
                document.getElementById(
                    "create-shift-button"
                );

            const shiftName =
                document.getElementById(
                    "shift-name"
                );

            const status =
                document.getElementById(
                    "status"
                );

            button.addEventListener(
                "click",
                async () => {

                    const response =
                        await fetch(
                            "/create-shift",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        shift_name:
                                            shiftName.value
                                    })
                            }
                        );

                    const result =
                        await response.json();

                    if (result.success) {

                        status.textContent =
                            "Shift created. ID: "
                            + result.shift_id;

                    } else {

                        status.textContent =
                            "Error: "
                            + result.message;

                    }

                }
            );

        </script>

    </body>
    </html>
    """
@main.route("/previous-shift-cash", methods=["GET"])
def previous_shift_cash():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        # Find the most recently closed shift
        cursor.execute(
            """
            SELECT id
            FROM shifts
            WHERE status = 'closed'
            ORDER BY ended_at DESC, id DESC
            LIMIT 1
            """
        )

        previous_shift = cursor.fetchone()

        if not previous_shift:
            return jsonify({
                "success": False,
                "message": "No previous closed shift found."
            })

        shift_id = previous_shift["id"]

        # Prefer the latest closing count
        cursor.execute(
            """
            SELECT remaining_cash
            FROM cash_counts
            WHERE shift_id = ?
              AND count_type = 'closing'
            ORDER BY id DESC
            LIMIT 1
            """,
            (shift_id,)
        )

        cash_count = cursor.fetchone()

        # If there is no closing count, use the latest transfer count
        if not cash_count:
            cursor.execute(
                """
                SELECT remaining_cash
                FROM cash_counts
                WHERE shift_id = ?
                  AND count_type = 'transfer'
                ORDER BY id DESC
                LIMIT 1
                """,
                (shift_id,)
            )

            cash_count = cursor.fetchone()

        # If there is still no result, use the latest cash count
        if not cash_count:
            cursor.execute(
                """
                SELECT remaining_cash
                FROM cash_counts
                WHERE shift_id = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (shift_id,)
            )

            cash_count = cursor.fetchone()

        if not cash_count:
            return jsonify({
                "success": False,
                "message": "No cash count found for the previous shift."
            })

        return jsonify({
            "success": True,
            "remaining_cash": cash_count["remaining_cash"]
        })

    finally:
        connection.close()