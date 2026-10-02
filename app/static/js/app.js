from flask import (
    Blueprint,
    jsonify,
    render_template,
    request,
)

from database import get_connection


main = Blueprint(
    "main",
    __name__
)


# ============================================================
# HOME
# ============================================================

@main.route("/")
def index():

    return cash_count()


# ============================================================
# CASH COUNT PAGE
# ============================================================

@main.route("/cash-count")
def cash_count():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM shifts
        WHERE status = 'open'
        ORDER BY id DESC
        LIMIT 1
        """
    )

    current_shift = cursor.fetchone()

    connection.close()

    return render_template(
        "cash_count.html",
        current_shift=current_shift
    )


# ============================================================
# SAVE CASH COUNT
# ============================================================

@main.route(
    "/save-cash-count",
    methods=["POST"]
)
def save_cash_count():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No cash count data was received."
        }), 400


    # --------------------------------------------------------
    # Get shift ID
    # --------------------------------------------------------

    shift_id = data.get("shift_id")

    if shift_id is None:

        return jsonify({
            "success": False,
            "message": "No shift ID was provided."
        }), 400


    try:

        shift_id = int(shift_id)

    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": "Invalid shift ID."
        }), 400


    # --------------------------------------------------------
    # Get cash count values
    # --------------------------------------------------------

    count_type = data.get(
        "count_type",
        "manual"
    )

    starting_cash = float(
        data.get("starting_cash", 0) or 0
    )

    cash_sales = float(
        data.get("cash_sales", 0) or 0
    )

    cash_in = float(
        data.get("cash_in", 0) or 0
    )

    cash_out = float(
        data.get("cash_out", 0) or 0
    )

    expected_cash = float(
        data.get("expected_cash", 0) or 0
    )

    actual_cash = float(
        data.get("actual_cash", 0) or 0
    )

    remaining_cash = float(
        data.get("remaining_cash", 0) or 0
    )

    remit = float(
        data.get("remit", 0) or 0
    )

    difference = float(
        data.get("difference", 0) or 0
    )


    denominations = data.get(
        "denominations",
        []
    )

    movements = data.get(
        "movements",
        []
    )


    # --------------------------------------------------------
    # Basic validation
    # --------------------------------------------------------

    valid_count_types = {
        "opening",
        "transfer",
        "closing",
        "manual"
    }

    if count_type not in valid_count_types:

        return jsonify({
            "success": False,
            "message": "Invalid count type."
        }), 400


    if starting_cash < 0:

        return jsonify({
            "success": False,
            "message": "Starting cash cannot be negative."
        }), 400


    if cash_sales < 0:

        return jsonify({
            "success": False,
            "message": "Cash sales cannot be negative."
        }), 400


    if cash_in < 0:

        return jsonify({
            "success": False,
            "message": "Cash in cannot be negative."
        }), 400


    if cash_out < 0:

        return jsonify({
            "success": False,
            "message": "Cash out cannot be negative."
        }), 400


    if actual_cash < 0:

        return jsonify({
            "success": False,
            "message": "Actual cash cannot be negative."
        }), 400


    if remaining_cash < 0:

        return jsonify({
            "success": False,
            "message": "Remaining cash cannot be negative."
        }), 400


    # --------------------------------------------------------
    # Database connection
    # --------------------------------------------------------

    connection = get_connection()
    cursor = connection.cursor()


    try:

        # ----------------------------------------------------
        # Verify that the shift exists and is OPEN
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM shifts
            WHERE id = ?
              AND status = 'open'
            """,
            (shift_id,)
        )

        shift = cursor.fetchone()


        if not shift:

            connection.close()

            return jsonify({
                "success": False,
                "message":
                    "The selected shift does not exist "
                    "or is not open."
            }), 400


        # ----------------------------------------------------
        # Save main cash count record
        # ----------------------------------------------------

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
        )


        cash_count_id = cursor.lastrowid


        # ----------------------------------------------------
        # Save denominations
        # ----------------------------------------------------

        for denomination in denominations:

            denomination_value = float(
                denomination.get(
                    "denomination",
                    0
                )
            )

            quantity = int(
                denomination.get(
                    "quantity",
                    0
                )
            )

            subtotal = float(
                denomination.get(
                    "subtotal",
                    denomination_value * quantity
                )
            )


            if denomination_value < 0:

                raise ValueError(
                    "Denomination cannot be negative."
                )


            if quantity < 0:

                raise ValueError(
                    "Denomination quantity cannot be negative."
                )


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
                    denomination_value,
                    quantity,
                    subtotal
                )
            )


        # ----------------------------------------------------
        # Save cash movements
        # ----------------------------------------------------

        for movement in movements:

            movement_type = movement.get(
                "type"
            )

            amount = float(
                movement.get(
                    "amount",
                    0
                )
            )

            reason = str(
                movement.get(
                    "reason",
                    ""
                )
            ).strip()


            if movement_type not in {
                "in",
                "out"
            }:

                raise ValueError(
                    "Invalid cash movement type."
                )


            if amount <= 0:

                raise ValueError(
                    "Cash movement amount must "
                    "be greater than zero."
                )


            if not reason:

                raise ValueError(
                    "Cash movement reason is required."
                )


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
                    movement_type,
                    amount,
                    reason
                )
            )


        # ----------------------------------------------------
        # Save everything
        # ----------------------------------------------------

        connection.commit()


        return jsonify({
            "success": True,
            "message":
                "Cash count saved successfully.",
            "cash_count_id":
                cash_count_id,
            "shift_id":
                shift_id
        })


    except ValueError as error:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400


    except Exception as error:

        connection.rollback()

        print(
            "Error saving cash count:",
            error
        )

        return jsonify({
            "success": False,
            "message":
                "An unexpected error occurred "
                "while saving the cash count."
        }), 500


    finally:

        connection.close()


# ============================================================
# CASH COUNT HISTORY
# ============================================================

@main.route("/cash-counts")
def cash_counts():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            cash_counts.*,
            shifts.shift_name
        FROM cash_counts
        LEFT JOIN shifts
            ON cash_counts.shift_id = shifts.id
        ORDER BY cash_counts.id DESC
        """
    )

    cash_count_records = cursor.fetchall()

    connection.close()

    return render_template(
        "cash_counts.html",
        cash_counts=cash_count_records
    )


# ============================================================
# CASH COUNT DETAIL
# ============================================================

@main.route(
    "/cash-count/<int:cash_count_id>"
)
def cash_count_detail(
    cash_count_id
):

    connection = get_connection()
    cursor = connection.cursor()


    # --------------------------------------------------------
    # Main cash count
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            cash_counts.*,
            shifts.shift_name
        FROM cash_counts
        LEFT JOIN shifts
            ON cash_counts.shift_id = shifts.id
        WHERE cash_counts.id = ?
        """,
        (cash_count_id,)
    )

    cash_count = cursor.fetchone()


    if not cash_count:

        connection.close()

        return (
            "Cash count not found.",
            404
        )


    # --------------------------------------------------------
    # Denominations
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM cash_denominations
        WHERE cash_count_id = ?
        ORDER BY denomination DESC
        """,
        (cash_count_id,)
    )

    denominations = cursor.fetchall()


    # --------------------------------------------------------
    # Cash movements
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM cash_movements
        WHERE cash_count_id = ?
        ORDER BY id ASC
        """,
        (cash_count_id,)
    )

    movements = cursor.fetchall()


    connection.close()


    return render_template(
        "cash_count_detail.html",
        cash_count=cash_count,
        denominations=denominations,
        movements=movements
    )


# ============================================================
# SHIFT MANAGEMENT
# ============================================================

@main.route("/shifts")
def shifts():

    connection = get_connection()
    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT *
        FROM shifts
        WHERE status = 'open'
        ORDER BY id DESC
        LIMIT 1
        """
    )

    current_shift = cursor.fetchone()


    connection.close()


    return render_template(
        "shifts.html",
        current_shift=current_shift
    )


# ============================================================
# OPEN SHIFT
# ============================================================

@main.route(
    "/open-shift",
    methods=["POST"]
)
def open_shift():

    data = request.get_json()


    if not data:

        return jsonify({
            "success": False,
            "message":
                "No shift data was received."
        }), 400


    shift_name = str(
        data.get(
            "shift_name",
            ""
        )
    ).strip()


    if not shift_name:

        return jsonify({
            "success": False,
            "message":
                "Shift name is required."
        }), 400


    connection = get_connection()
    cursor = connection.cursor()


    try:

        # ----------------------------------------------------
        # Check if another shift is already open
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM shifts
            WHERE status = 'open'
            LIMIT 1
            """
        )

        existing_shift = cursor.fetchone()


        if existing_shift:

            return jsonify({
                "success": False,
                "message":
                    "There is already an open shift."
            }), 400


        # ----------------------------------------------------
        # Create new shift
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO shifts (
                shift_name,
                started_at,
                status
            )
            VALUES (
                ?,
                CURRENT_TIMESTAMP,
                'open'
            )
            """,
            (shift_name,)
        )


        shift_id = cursor.lastrowid

        connection.commit()


        return jsonify({
            "success": True,
            "message":
                "Shift opened successfully.",
            "shift_id":
                shift_id
        })


    except Exception as error:

        connection.rollback()

        print(
            "Error opening shift:",
            error
        )

        return jsonify({
            "success": False,
            "message":
                "Could not open shift."
        }), 500


    finally:

        connection.close()


# ============================================================
# CLOSE SHIFT
# ============================================================

@main.route(
    "/close-shift/<int:shift_id>",
    methods=["POST"]
)
def close_shift(shift_id):

    connection = get_connection()
    cursor = connection.cursor()


    try:

        # ----------------------------------------------------
        # Check that the shift exists and is open
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT *
            FROM shifts
            WHERE id = ?
              AND status = 'open'
            """,
            (shift_id,)
        )

        shift = cursor.fetchone()


        if not shift:

            return jsonify({
                "success": False,
                "message":
                    "Shift does not exist "
                    "or is already closed."
            }), 400


        # ----------------------------------------------------
        # Close shift
        # ----------------------------------------------------

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
                "Shift closed successfully.",
            "shift_id":
                shift_id
        })


    except Exception as error:

        connection.rollback()

        print(
            "Error closing shift:",
            error
        )

        return jsonify({
            "success": False,
            "message":
                "Could not close shift."
        }), 500


    finally:

        connection.close()