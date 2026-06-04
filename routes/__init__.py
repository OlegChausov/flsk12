# Инициализация пакета
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
db = SQLAlchemy()
class DataSubmission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True)
    payload = db.Column(JSONB, nullable=False)
