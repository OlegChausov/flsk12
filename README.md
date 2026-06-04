# Application flsk12

Веб-приложение на базе микровреймворка Flask, разработанное для демонстрации работы со сложными структурами данных в PostgreSQL. Проект подготовлен для развертывания в production-окружении с использованием связки Gunicorn и Nginx.

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
2. Создайте базу данных и пользователя (при необходимости замените данные на свои):
   ```sql
   CREATE DATABASE dynamic_form_db;
   CREATE USER tester WITH PASSWORD 'my_password';
   ALTER ROLE tester SET client_encoding TO 'utf8';
   ALTER ROLE tester SET default_transaction_isolation TO 'read committed';
   ALTER ROLE tester SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE dynamic_form_db TO tester;
   GRANT ALL ON SCHEMA public TO tester;
   \q
   ```

### Шаг 3. Клонирование репозитория и настройка окружения
1. Перейдите в директорию `/var/www/` и склонируйте ваш репозиторий:
   ```bash
   cd /var/www
   sudo git clone https://github.com/OlegChausov/flsk12
   
   # Предоставляем временные права вашему текущему пользователю для настройки окружения
   sudo chown -R $USER:$USER flsk12
   cd flsk12
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
4. *(Опционально)* Если вы хотите передать настройки через файл окружения, создайте файл `.env` в корне проекта:
   ```ini
   DATABASE_URL=postgresql://tester:my_password@localhost:5432/dynamic_form_db
   SECRET_KEY=super-secret-key-change-me
   ```
5. **Финальная настройка прав:** передаем права пользователю `www-data` и открываем доступ к статическим файлам для Nginx:
   ```bash
   cd /var/www
   sudo chown -R www-data:www-data flsk12
   sudo chmod -R 755 /var/www/flsk12
   ```

### Шаг 4. Настройка Gunicorn как системного сервиса
1. Создайте файл службы systemd для управления процессом Gunicorn:
   ```bash
   sudo nano /etc/systemd/system/flaskapp.service
   ```
2. Вставьте следующее содержимое. Сервис поддерживает как чтение из файла `.env` (если он создан), так и прямую передачу переменных:
   ```ini
   [Unit]
   Description=Gunicorn instance to serve Flask Application
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/flsk12
   Environment="PATH=/var/www/flsk12/venv/bin"
   
   # Автоматическое чтение переменных из файла .env (если он существует)
   EnvironmentFile=-/var/www/flsk12/.env
   
   # Альтернативный способ передачи переменных напрямую в сервис (если .env не используется)
   # Environment="DATABASE_URL=postgresql://tester:my_password@localhost:5432/dynamic_form_db"
   # Environment="SECRET_KEY=super-secret-key-change-me"
   
   # Изолированная директория для безопасного управления сокетом процессов
   RuntimeDirectory=flaskapp
   ExecStart=/var/www/flsk12/venv/bin/gunicorn --workers 3 --bind unix:/run/flaskapp/flaskapp.sock app:app

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
           proxy_pass http://unix:/run/flaskapp/flaskapp.sock;
       }

       location /static/ {
           alias /var/www/flsk12/static/;
       }

       access_log /var/log/nginx/flaskapp_access.log;
       error_log /var/log/nginx/flaskapp_error.log;
   }
   ```
3. Активируйте конфигурацию, создав символическую ссылку:
   ```bash
   sudo ln -s /etc/nginx/sites-available/flaskapp /etc/nginx/sites-enabled/
   ```
   
4. Удалите дефолтную конфигурацию Nginx:
```bash
   sudo rm /etc/nginx/sites-enabled/default
```
5. Проверьте конфигурацию Nginx на ошибки и перезапустите сервис:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```
> **Примечание:** логин `tester` и пароль `my_password` используются как значения по умолчанию в конфигурации приложения. Если вы измените их здесь, обновите переменную окружения `DATABASE_URL` соответственно.
Приложение успешно развернуто и доступно по адресу `http://your_domain_or_ip`.




---

# Application flsk12

A Flask-based web application demonstrating work with complex data structures in PostgreSQL. The project is prepared for production deployment using Gunicorn and Nginx.

---

## Deployment Instructions

Follow these steps to set up and run the project on a server (Ubuntu / WSL).

### Step 1. System Update and Dependencies Installation
Update the local package index and install the required system components:
```bash
sudo apt update
sudo apt install python3-pip python3-venv python3-dev postgresql postgresql-contrib nginx curl git -y
```

### Step 2. PostgreSQL Database Setup
1. Enter the PostgreSQL console:
```bash
   sudo -u postgres psql
```
2. Create the database and user (replace credentials if needed):
```sql
   CREATE DATABASE dynamic_form_db;
   CREATE USER tester WITH PASSWORD 'my_password';
   ALTER ROLE tester SET client_encoding TO 'utf8';
   ALTER ROLE tester SET default_transaction_isolation TO 'read committed';
   ALTER ROLE tester SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE dynamic_form_db TO tester;
   GRANT ALL ON SCHEMA public TO tester;
   \q
```

### Step 3. Clone Repository and Set Up Environment
1. Navigate to `/var/www/` and clone the repository:
```bash
   cd /var/www
   sudo git clone https://github.com/OlegChausov/flsk12

   # Grant temporary permissions to your current user for environment setup
   sudo chown -R $USER:$USER flsk12
   cd flsk12
```
2. Create and activate a virtual environment:
```bash
   python3 -m venv venv
   source venv/bin/activate
```
3. Install project dependencies:
```bash
   pip install --upgrade pip
   pip install -r requirements.txt
```
4. *(Optional)* To pass settings via an environment file, create a `.env` file in the project root:
```ini
   DATABASE_URL=postgresql://tester:my_password@localhost:5432/dynamic_form_db
   SECRET_KEY=super-secret-key-change-me
```
5. **Final permissions setup:** transfer ownership to `www-data` and grant Nginx access to static files:
```bash
   cd /var/www
   sudo chown -R www-data:www-data flsk12
   sudo chmod -R 755 /var/www/flsk12
```

### Step 4. Configure Gunicorn as a System Service
1. Create a systemd service file:
```bash
   sudo nano /etc/systemd/system/flaskapp.service
```
2. Paste the following content. The service supports both `.env` file and direct variable passing:
```ini
   [Unit]
   Description=Gunicorn instance to serve Flask Application
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/flsk12
   Environment="PATH=/var/www/flsk12/venv/bin"

   # Automatically read variables from .env file if it exists
   EnvironmentFile=-/var/www/flsk12/.env

   # Alternative: pass variables directly (if .env is not used)
   # Environment="DATABASE_URL=postgresql://tester:my_password@localhost:5432/dynamic_form_db"
   # Environment="SECRET_KEY=super-secret-key-change-me"

   # Isolated directory for secure socket management
   RuntimeDirectory=flaskapp
   ExecStart=/var/www/flsk12/venv/bin/gunicorn --workers 3 --bind unix:/run/flaskapp/flaskapp.sock app:app

   [Install]
   WantedBy=multi-user.target
```
3. Start the Gunicorn service and enable it on boot:
```bash
   sudo systemctl start flaskapp
   sudo systemctl enable flaskapp
```

### Step 5. Configure Nginx as a Reverse Proxy
1. Create an Nginx configuration file:
```bash
   sudo nano /etc/nginx/sites-available/flaskapp
```
2. Add the following configuration (replace `your_domain_or_ip` with your server IP or localhost):
```nginx
   server {
       listen 80;
       server_name your_domain_or_ip;

       location / {
           include proxy_params;
           proxy_pass http://unix:/run/flaskapp/flaskapp.sock;
       }

       location /static/ {
           alias /var/www/flsk12/static/;
       }

       access_log /var/log/nginx/flaskapp_access.log;
       error_log /var/log/nginx/flaskapp_error.log;
   }
```
3. Enable the configuration by creating a symbolic link:
```bash
   sudo ln -s /etc/nginx/sites-available/flaskapp /etc/nginx/sites-enabled/
```
4. Remove the default Nginx configuration:
```bash
   sudo rm /etc/nginx/sites-enabled/default
```

5. Test the Nginx configuration and restart the service:
```bash
   sudo nginx -t
   sudo systemctl restart nginx
```

> **Note:** The login `tester` and password `my_password` are used as default values in the application configuration. If you change them here, update the `DATABASE_URL` environment variable accordingly.

The application is now deployed and available at `http://your_domain_or_ip`.