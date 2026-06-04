Веб-приложение на базе Flask для динамического сбора данных из форм и их сохранения в базу данных PostgreSQL (в формате JSONB). Проект подготовлен для развертывания в production-окружении с использованием связки Gunicorn и Nginx.

---

## Инструкция по развертыванию приложения

Выполните следующие шаги для настройки и запуска проекта на сервере (Ubuntu / WSL).

### Шаг 1. Обновление системы и установка зависимостей
Обновите локальный индекс пакетов и установите необходимые системные компоненты:
```bash
sudo apt update
sudo apt install python3-pip python3-venv python3-dev postgresql postgresql-contrib nginx curl git -y
```

### Шаг 2. Настройка базы данных PostgreSQL
1. Войдите в консоль PostgreSQL:
   ```bash
   sudo -u postgres psql
   ```
2. Создайте базу данных и пользователя:
   ```sql
   CREATE DATABASE app_db;
   CREATE USER app_user WITH PASSWORD 'your_password';
   ALTER ROLE app_user SET client_encoding TO 'utf8';
   ALTER ROLE app_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE app_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
   \q
   ```

### Шаг 3. Клонирование репозитория и настройка окружения
1. Перейдите в директорию `/var/www/` и склонируйте ваш репозиторий:
   ```bash
   cd /var/www
   sudo git clone <ССЫЛКА_НА_ВАШ_РЕПОЗИТОРИЙ> web-form-collector
   sudo chown -R USER:USER web-form-collector
   cd web-form-collector
   ```
2. Создайте и активируйте виртуальное окружение:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Установите зависимости проекта:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Шаг 4. Настройка Gunicorn как системного сервиса
1. Создайте файл службы systemd для управления процессом Gunicorn:
   ```bash
   sudo nano /etc/systemd/system/flaskapp.service
   ```
2. Вставьте следующее содержимое:
   ```ini
   [Unit]
   Description=Gunicorn instance to serve Flask Application
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/web-form-collector
   Environment="PATH=/var/www/web-form-collector/venv/bin"
   ExecStart=/var/www/web-form-collector/venv/bin/gunicorn --workers 3 --bind unix:flaskapp.sock app:app

   [Install]
   WantedBy=multi-user.target
   ```
3. Запустите сервис Gunicorn и добавьте его в автозагрузку:
   ```bash
   sudo systemctl start flaskapp
   sudo systemctl enable flaskapp
   ```

### Шаг 5. Настройка Nginx в качестве Reverse Proxy
1. Создайте конфигурационный файл в Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/flaskapp
   ```
2. Добавьте следующую конфигурацию (замените `your_domain_or_ip` на IP-адрес вашего сервера или localhost):
   ```nginx
   server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/web-form-collector/flaskapp.sock;
    }

    location /static/ {
        alias /var/www/web-form-collector/static/;
    }

    access_log /var/log/nginx/flaskapp_access.log;
    error_log /var/log/nginx/flaskapp_error.log;
}

   ```
3. Активируйте конфигурацию, создав символическую ссылку:
   ```bash
   sudo ln -s /etc/nginx/sites-available/flaskapp /etc/nginx/sites-enabled/
   ```
4. Проверьте конфигурацию Nginx на ошибки и перезапустите сервис:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```