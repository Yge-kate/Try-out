from flask import Flask, render_template, request, redirect, url_for, flash
from models import db
from models import Transaction
from datetime import datetime


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "dev"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///finance.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    @app.route("/")
    def index():
        # Basic aggregates
        from sqlalchemy import func
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)

        month_income_cents = db.session.query(func.coalesce(func.sum(Transaction.amount_cents), 0)).filter(
            Transaction.is_income.is_(True), Transaction.timestamp >= month_start
        ).scalar()
        month_expense_cents = db.session.query(func.coalesce(func.sum(Transaction.amount_cents), 0)).filter(
            Transaction.is_income.is_(False), Transaction.timestamp >= month_start
        ).scalar()
        total_balance_cents = db.session.query(func.coalesce(func.sum(Transaction.amount_cents), 0)).scalar()

        latest = (
            Transaction.query.order_by(Transaction.timestamp.desc()).limit(10).all()
        )

        def fmt(cents: int) -> str:
            return f"${cents/100:,.2f}"

        return render_template(
            "dashboard.html",
            balance=fmt(total_balance_cents or 0),
            income=fmt(month_income_cents or 0),
            expenses=fmt(abs(month_expense_cents or 0)),
            transactions=latest,
        )

    @app.route("/transactions/new", methods=["GET", "POST"])
    def new_transaction():
        if request.method == "POST":
            description = request.form.get("description", "").strip()
            category = request.form.get("category", "").strip() or None
            amount = request.form.get("amount", "0").strip()
            kind = request.form.get("kind", "expense")
            try:
                amount_float = float(amount)
            except ValueError:
                flash("Invalid amount", "error")
                return redirect(url_for("new_transaction"))

            if kind == "expense" and amount_float > 0:
                amount_float = -amount_float

            cents = int(round(amount_float * 100))
            tx = Transaction(
                description=description or "Untitled",
                category=category,
                amount_cents=cents,
                is_income=(kind == "income"),
                timestamp=datetime.utcnow(),
            )
            db.session.add(tx)
            db.session.commit()
            flash("Transaction added", "success")
            return redirect(url_for("index"))

        return render_template("new_transaction.html")

    return app


app = create_app()

