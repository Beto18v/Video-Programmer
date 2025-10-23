# 🚀 Guía de Despliegue - Video Programmer API

## 📋 Estrategias de Despliegue

### Opción 1: Docker Compose (Recomendado para Desarrollo)

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.secure
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://user:pass@db:5432/video_programmer
    volumes:
      - ./storage:/app/storage
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=video_programmer
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docs/config/nginx-ssl.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - api
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Opción 2: Kubernetes

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-programmer-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: video-programmer-api
  template:
    metadata:
      labels:
        app: video-programmer-api
    spec:
      containers:
        - name: api
          image: video-programmer/api:latest
          ports:
            - containerPort: 8000
          env:
            - name: ENVIRONMENT
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: database_url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Opción 3: AWS ECS

```hcl
# terraform/main.tf
resource "aws_ecs_cluster" "video_programmer" {
  name = "video-programmer-cluster"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "video-programmer-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "video-programmer/api:latest"
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
        }
      ]
      environment = [
        {
          name  = "ENVIRONMENT"
          value = "production"
        }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_secret.arn
        }
      ]
    }
  ])
}
```

## 🔧 Configuración de Producción

### Variables de Entorno

```bash
# .env.production
ENVIRONMENT=production
DEBUG=false

# Base de datos
DATABASE_URL=postgresql://user:secure_password@db-host:5432/video_programmer
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30

# Redis
REDIS_URL=redis://redis-host:6379/0

# JWT
SECRET_KEY=your-super-secure-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION=1800

# APIs Externas
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Storage
STORAGE_PATH=/app/storage
MAX_FILE_SIZE=2147483648  # 2GB

# Rate Limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=/app/logs/app.log

# CORS
ALLOWED_ORIGINS=https://your-frontend.com,https://admin.your-frontend.com
```

### Configuración de Nginx

```nginx
# docs/config/nginx-ssl.conf
upstream api_backend {
    server api:8000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API endpoints
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Static files
    location /static/ {
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## 🐳 Dockerfile Seguro

```dockerfile
# Dockerfile.secure
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd --create-home --shell /bin/bash app \
    && mkdir -p /app \
    && chown -R app:app /app

USER app
WORKDIR /app

# Instalar dependencias Python
COPY --chown=app:app requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY --chown=app:app . .

# Crear directorios necesarios
RUN mkdir -p storage logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["python", "-m", "app.main_secure"]
```

## 🔒 Configuración de Seguridad

### Certificados SSL

```bash
# Generar certificado auto-firmado (desarrollo)
openssl req -x509 -newkey rsa:4096 \
    -keyout key.pem -out cert.pem -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Let's Encrypt (producción)
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

### Secrets Management

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
    --name video-programmer/prod/database \
    --secret-string '{"username":"dbuser","password":"dbpass"}'

# Docker Secrets
echo "super-secret-key" | docker secret create jwt_secret -
```

## 📊 Monitoreo y Logging

### Configuración de Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "video-programmer-api"
    static_configs:
      - targets: ["api:8000"]
    metrics_path: "/metrics"
```

### ELK Stack para Logs

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    paths:
      - /app/logs/*.log
    json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "video-programmer-%{+yyyy.MM.dd}"
```

## 🚀 Estrategia de CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest tests/ -v --cov=app --cov-report=xml

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: video-programmer/api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Actualizar servicios en producción
          docker-compose -f docker-compose.prod.yml up -d api
```

### Blue-Green Deployment

```bash
# Script de deployment blue-green
#!/bin/bash

# Crear nueva versión
docker tag video-programmer/api:latest video-programmer/api:v2

# Actualizar servicio blue
docker service update --image video-programmer/api:v2 video-programmer_api_blue

# Verificar health
sleep 30
if curl -f http://blue-service/health; then
    # Cambiar tráfico a blue
    update_load_balancer blue

    # Apagar green
    docker service update --replicas 0 video-programmer_api_green
else
    # Rollback
    docker service update --replicas 0 video-programmer_api_blue
    echo "Deployment failed, rolling back"
    exit 1
fi
```

## 🔄 Backup y Recovery

### Base de Datos

```bash
# Backup automático
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h db-host -U dbuser -d video_programmer > backup_$DATE.sql

# Subir a S3
aws s3 cp backup_$DATE.sql s3://video-programmer-backups/
```

### Archivos

```bash
# Backup de videos y assets
rsync -avz /app/storage/ /backup/storage/
rsync -avz /app/logs/ /backup/logs/
```

## 📈 Escalado Horizontal

### Auto Scaling con AWS

```hcl
resource "aws_appautoscaling_target" "api_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/video-programmer-cluster/video-programmer-api"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu_policy" {
  name               = "cpu-auto-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = "service/video-programmer-cluster/video-programmer-api"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## 🧪 Testing en Producción

### Smoke Tests

```bash
#!/bin/bash
# smoke-test.sh

# Verificar API health
if ! curl -f http://api/health; then
    echo "Health check failed"
    exit 1
fi

# Verificar base de datos
if ! curl -f http://api/api/v1/health/db; then
    echo "Database check failed"
    exit 1
fi

# Verificar endpoints críticos
endpoints=(
    "/api/v1/plans"
    "/api/v1/auth/login"
)

for endpoint in "${endpoints[@]}"; do
    if ! curl -f http://api$endpoint; then
        echo "Endpoint $endpoint failed"
        exit 1
    fi
done

echo "All smoke tests passed"
```

### Canary Deployment

```yaml
# Istio Virtual Service para canary
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: video-programmer-api
spec:
  http:
    - route:
        - destination:
            host: video-programmer-api
            subset: v1
          weight: 90
        - destination:
            host: video-programmer-api
            subset: v2
          weight: 10
```

---

_Guía de despliegue - Octubre 2025_
