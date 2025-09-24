FROM python:3.12-alpine

# Only what we need
RUN apk add --no-cache postgresql15-client
RUN pip install --no-cache-dir fastapi uvicorn

WORKDIR /app
COPY app.py /app/app.py

ENV PYTHONUNBUFFERED=1
EXPOSE 55555

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "55555"]
