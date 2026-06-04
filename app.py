import os
from flask import Flask, render_template, request, jsonify
from config import Config
from database import db
from sqlalchemy.dialects.postgresql import JSONB

# Инициализируем объект Flask глобально, чтобы маршруты регистрировались намертво
app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

# Описываем модель данных PostgreSQL (JSONB)
class DocumentRecord(db.Model):
    __tablename__ = 'document_records'
    id = db.Column(db.Integer, primary_key=True)
    form_data = db.Column(JSONB, nullable=False)

# Инициализируем таблицы PostgreSQL в контексте приложения при старте
with app.app_context():
    db.create_all()

# --- МАРШРУТЫ ПРИЛОЖЕНИЯ ---

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    # Собираем данные из полей отправленной формы
    payload = {key: val for key, val in request.form.items()}
    
    # Сохраняем в PostgreSQL (JSONB)
    new_record = DocumentRecord(form_data=payload)
    db.session.add(new_record)
    db.session.commit()
    
    return jsonify({"status": "success"})

@app.route('/records', methods=['GET'])
def get_records():
    # Извлекаем данные для просмотра логов JSONB
    records = DocumentRecord.query.order_by(DocumentRecord.id.desc()).all()
    output = [{"id": r.id, "data": r.form_data} for r in records]
    return jsonify(output)






# Точка входа для запуска в режиме разработки
if __name__ == '__main__':
    app.run(debug=True)
