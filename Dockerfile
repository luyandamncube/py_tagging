FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Minimal system deps
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Ensure rclone config path exists 
RUN mkdir -p /root/.config/rclone

# Install rclone
RUN apt-get update \
 && apt-get install -y curl unzip ca-certificates \
 && curl https://rclone.org/install.sh | bash \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts/restore_db.sh /app/scripts/restore_db.sh

COPY .taggroups /app/.taggroups

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
