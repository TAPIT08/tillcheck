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

    return render_template(
        "cash_count.html"
    )


@main.route("/cash-count")
def cash_count():

    return render_template(
        "cash_count.html"
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