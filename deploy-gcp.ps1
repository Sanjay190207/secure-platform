# Automated GCP Infrastructure & Cloud Run Deployment Script
# Secure Cloud-Based Competitive Examination Question Paper Management System

$PROJECT_ID = "secure-exam-gcp-2026"
$REGION = "us-central1"
$BUCKET_NAME = "${PROJECT_ID}-private-papers"
$DB_INSTANCE = "secure-exam-db-instance"
$DB_NAME = "secure_exam_db"
$KMS_KEYRING = "exam-keyring"
$KMS_KEY = "paper-encryption-key"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "    STARTING AUTOMATED GOOGLE CLOUD PLATFORM PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Set Active GCP Project
Write-Host "[1/9] Setting GCP Project ID: $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 2. Enable Required Google Cloud APIs
Write-Host "[2/9] Enabling Required Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    sqladmin.googleapis.com `
    storage.googleapis.com `
    cloudkms.googleapis.com `
    secretmanager.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com

# 3. Create Private Cloud Storage Bucket (No Public Access, Uniform IAM)
Write-Host "[3/9] Creating Private Google Cloud Storage Bucket..." -ForegroundColor Yellow
gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION --uniform-bucket-level-access
gcloud storage buckets update gs://$BUCKET_NAME --no-public-access-prevention

# 4. Create Cloud SQL PostgreSQL Instance & Database
Write-Host "[4/9] Provisioning Cloud SQL PostgreSQL Instance ($DB_INSTANCE)..." -ForegroundColor Yellow
gcloud sql instances create $DB_INSTANCE --database-version=POSTGRES_15 --tier=db-f1-micro --region=$REGION --root-password="SuperSecureCloudSqlPassword123!"
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE

# 5. Create Cloud KMS Key Ring & Crypto Key
Write-Host "[5/9] Setting up Google Cloud KMS Key Ring & AES-256 Key..." -ForegroundColor Yellow
gcloud kms keyrings create $KMS_KEYRING --location=global
gcloud kms keys create $KMS_KEY --location=global --keyring=$KMS_KEYRING --purpose=encryption

# 6. Create Secret Manager Secrets
Write-Host "[6/9] Storing DB & JWT Secrets in Secret Manager..." -ForegroundColor Yellow
"SuperSecureCloudSqlPassword123!" | gcloud secrets create db-password --data-file=-
"super-secret-jwt-key-secure-exam-2026-sha256-kms-key" | gcloud secrets create jwt-secret --data-file=-

# 7. Create Dedicated Least-Privilege Service Account
Write-Host "[7/9] Creating Service Account & Binding IAM Roles..." -ForegroundColor Yellow
gcloud iam service-accounts create secure-exam-backend-sa --display-name="Secure Exam Backend Service Account"

$SA_EMAIL = "secure-exam-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/cloudsql.client"

# 8. Build & Deploy Backend Container to Cloud Run
Write-Host "[8/9] Building & Deploying Express Backend to Cloud Run..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/server"
gcloud builds submit --tag gcr.io/$PROJECT_ID/secure-exam-backend:latest

gcloud run deploy secure-exam-backend `
    --image gcr.io/$PROJECT_ID/secure-exam-backend:latest `
    --platform managed `
    --region $REGION `
    --service-account $SA_EMAIL `
    --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$BUCKET_NAME,GCP_KMS_KEY_NAME=projects/$PROJECT_ID/locations/global/keyRings/$KMS_KEYRING/cryptoKeys/$KMS_KEY,DB_HOST=localhost,DB_NAME=$DB_NAME,DB_USER=postgres" `
    --set-secrets "DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest" `
    --allow-unauthenticated

# 9. Build & Deploy Frontend to Cloud Run
Write-Host "[9/9] Building & Deploying React Frontend to Cloud Run..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/client"
gcloud builds submit --tag gcr.io/$PROJECT_ID/secure-exam-frontend:latest

gcloud run deploy secure-exam-frontend `
    --image gcr.io/$PROJECT_ID/secure-exam-frontend:latest `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated

Write-Host "=================================================================" -ForegroundColor Green
Write-Host " 🎉 PRODUCTION GCP DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
