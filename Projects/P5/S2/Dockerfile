# Example Dockerfile for 'auth' service
FROM python:3.9-slim-buster
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
# Mở cổng Flask
EXPOSE 5000
CMD ["python", "app.py"]
