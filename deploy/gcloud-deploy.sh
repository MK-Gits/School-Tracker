#!/usr/bin/env bash
set -euo pipefail

# Minimal secure deploy script for Cloud Run + Cloud SQL
# Usage: set DB_PASSWORD env var, then run: ./deploy/gcloud-deploy.sh

# Config (override by exporting environment variables before running)
PROJECT_ID="${PROJECT_ID:-school-tracker-507002}"
REGION="${REGION:-us-central1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/school-tracker:latest"
SQL_INSTANCE_NAME="${SQL_INSTANCE_NAME:-school-tracker-db}"
DB_NAME="${DB_NAME:-schooltracker}"
DB_USER="${DB_USER:-webapp}"
DB_PASSWORD="${DB_PASSWORD:-}"
SECRET_NAME="database-url-secret"
SERVICE_ACCOUNT_NAME="school-tracker-run-sa"

if [ -z "${DB_PASSWORD}" ]; then
  echo "ERROR: DB_PASSWORD is empty. Export DB_PASSWORD before running, for example:"
  echo "  export DB_PASSWORD=\"$(openssl rand -base64 18)\""
  exit 1
fi

echo "Using PROJECT_ID=${PROJECT_ID} and REGION=${REGION}"

# Enable required APIs
gcloud config set project ${PROJECT_ID}
gcloud services enable run.googleapis.com sqladmin.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com

# Build & push image. If local Docker is unavailable, use Cloud Build.
if command -v docker >/dev/null 2>&1; then
  echo "Building image locally with Docker..."
  docker build -t ${IMAGE_NAME} .
  gcloud auth configure-docker --quiet
  docker push ${IMAGE_NAME}
else
  echo "Docker not found — building with Cloud Build..."
  gcloud builds submit --tag ${IMAGE_NAME}
fi

# Create Cloud SQL Postgres instance (tiny tier for minimal cost)
gcloud sql instances create ${SQL_INSTANCE_NAME} \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=${REGION} || true

# Create database and user
gcloud sql databases create ${DB_NAME} --instance=${SQL_INSTANCE_NAME} || true
gcloud sql users set-password ${DB_USER} --instance=${SQL_INSTANCE_NAME} --password="${DB_PASSWORD}"

# Get instance connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe ${SQL_INSTANCE_NAME} --format='value(connectionName)')

# Build the full DATABASE_URL and store in Secret Manager
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

if ! gcloud secrets describe "${SECRET_NAME}" >/dev/null 2>&1; then
  echo -n "${DB_URL}" | gcloud secrets create "${SECRET_NAME}" --data-file=- --replication-policy="automatic"
else
  echo -n "${DB_URL}" | gcloud secrets versions add "${SECRET_NAME}" --data-file=-
fi

# Create a dedicated service account for Cloud Run (least privilege)
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" --display-name="Cloud Run service account for school-tracker"
fi

# Grant runtime permissions to the service account
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role=roles/cloudsql.client || true
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role=roles/secretmanager.secretAccessor || true
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role=roles/logging.logWriter || true
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role=roles/monitoring.metricWriter || true

# Deploy to Cloud Run and inject the DATABASE_URL secret
gcloud run deploy school-tracker \
  --image=${IMAGE_NAME} \
  --region=${REGION} \
  --platform=managed \
  --service-account=${SERVICE_ACCOUNT_EMAIL} \
  --add-cloudsql-instances=${INSTANCE_CONNECTION_NAME} \
  --set-secrets="DATABASE_URL=${SECRET_NAME}:latest" \
  --allow-unauthenticated

echo "Deployment complete. To view the service URL run:" 
echo "  gcloud run services describe school-tracker --region=${REGION} --platform=managed --format=\"value(status.url)\""
echo
echo "Security notes:"
echo "- Database password stored in Secret Manager as '${SECRET_NAME}'."
echo "- Cloud Run runs as '${SERVICE_ACCOUNT_EMAIL}' and has only Cloud SQL + Secret Manager access."
echo "- Enable automated backups in Cloud SQL console and restrict DB public access if you don't need it."
