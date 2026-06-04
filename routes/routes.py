from flask import Blueprint, render_template, request, jsonify
from database import db
from sqlalchemy.dialects.postgresql import JSONB

class DocumentRecord(db.Model):
    __tablename__ = 'document_records'
    
    id = db.Column(db.Integer, primary_key=True)
    form_data = db.Column(JSONB, nullable=False)

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@main_bp.route('/submit', methods=['POST'])
def submit():
    # Собираем все пришедшие инпуты из формы в dict
    payload = {key: val for key, val in request.form.items()}
    
    # Сохраняем структуру прямо в поле JSONB базы данных PostgreSQL
    new_record = DocumentRecord(form_data=payload)
    db.session.add(new_record)
    db.session.commit()
    
    return jsonify({"status": "success"})

@main_bp.route('/records', methods=['GET'])
def get_records():
    # Вытягиваем все сохраненные сущности для динамического просмотра
    records = DocumentRecord.query.order_by(DocumentRecord.id.desc()).all()
    output = [{"id": r.id, "data": r.form_data} for r in records]
    return jsonify(output)
