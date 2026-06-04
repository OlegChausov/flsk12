import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key-change-me'
    # Строка подключения: пользователь 'tester', пароль 'my_password', база 'dynamic_form_db'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://tester:my_password@localhost:5432/dynamic_form_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False