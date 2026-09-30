from flask import Blueprint, render_template

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