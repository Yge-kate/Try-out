from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    description = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(64), nullable=True, index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    is_income = db.Column(db.Boolean, nullable=False, default=False, index=True)

    def amount(self) -> Decimal:
        return Decimal(self.amount_cents) / Decimal(100)

    @staticmethod
    def from_amount(amount: Decimal, **kwargs) -> "Transaction":
        cents = int(amount * 100)
        return Transaction(amount_cents=cents, **kwargs)

