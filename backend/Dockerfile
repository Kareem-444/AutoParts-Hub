FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD python manage.py collectstatic --noinput && \
    python manage.py migrate --noinput && \
    daphne -b 0.0.0.0 -p 8000 config.asgi:application
