from decimal import Decimal
from datetime import datetime

from app import create_app
from models import db, Transaction


app = create_app()


@app.cli.command("init-db")
def init_db() -> None:
    db.create_all()
    print("Initialized the database.")


@app.cli.command("seed-demo")
def seed_demo() -> None:
    db.create_all()
    if Transaction.query.count() > 0:
        print("Database already has transactions. Skipping seed.")
        return
    samples = [
        Transaction.from_amount(Decimal("2500.00"), description="Salary", category="Income", is_income=True, timestamp=datetime.utcnow()),
        Transaction.from_amount(Decimal("-120.50"), description="Groceries", category="Food", is_income=False, timestamp=datetime.utcnow()),
        Transaction.from_amount(Decimal("-45.00"), description="Internet", category="Utilities", is_income=False, timestamp=datetime.utcnow()),
        Transaction.from_amount(Decimal("-60.00"), description="Gas", category="Transport", is_income=False, timestamp=datetime.utcnow()),
    ]
    db.session.add_all(samples)
    db.session.commit()
    print("Seeded demo data.")

