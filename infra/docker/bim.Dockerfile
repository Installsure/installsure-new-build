FROM python:3.11-slim
WORKDIR /app
COPY bim/requirements.txt .
RUN apt-get update && apt-get install -y libgl1 && pip install -r requirements.txt
COPY bim /app
CMD ["python", "-m", "src.worker"]
