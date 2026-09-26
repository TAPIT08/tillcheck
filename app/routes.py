from flask import Blueprint, render_template

main = Blueprint("main", __name__)


@main.route("/")
def dashboard():
    return render_template("dashboard.html")


@main.route("/cash-count")
def cash_count():
    return render_template("cash_count.html")