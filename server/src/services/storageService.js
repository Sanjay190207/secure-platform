const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const LOCAL_VAULT_DIR = process.env.VERCEL
  ? path.join('/tmp', 'storage_vault')
  : path.join(__dirname, '../../storage_vault');

// Ensure local vault folder exists for development mode
if (!fs.existsSync(LOCAL_VAULT_DIR)) {
  fs.mkdirSync(LOCAL_VAULT_DIR, { recursive: true, mode: 0o700 });
}

let storageClient = null;
let bucket = null;
let useGcp = false;

// Initialize GCP Storage if service account credentials or project is set
try {
  const { Storage } = require('@google-cloud/storage');
  if (process.env.GCP_PROJECT_ID && process.env.GCS_BUCKET_NAME && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || '')) {
    storageClient = new Storage({ projectId: process.env.GCP_PROJECT_ID });
    bucket = storageClient.bucket(process.env.GCS_BUCKET_NAME);
    useGcp = true;
    console.log(`[STORAGE] Connected to Google Cloud Storage bucket: ${process.env.GCS_BUCKET_NAME}`);
  } else {
    console.log('[STORAGE] GCP Credentials not active locally. Using Private Local Storage Vault fallback...');
  }
} catch (e) {
  console.log('[STORAGE] Using Private Local Storage Vault fallback for development...');
}

/**
 * Save Encrypted / Raw Paper Buffer to Storage Vault
 */
async function savePaperObject(objectName, buffer) {
  if (useGcp && bucket) {
    const file = bucket.file(objectName);
    await file.save(buffer, {
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'private, max-age=0, no-transform'
      },
      resumable: false
    });
    return { storageType: 'GCS', location: `gs://${process.env.GCS_BUCKET_NAME}/${objectName}` };
  } else {
    // Local Private Vault Path
    const filePath = path.join(LOCAL_VAULT_DIR, objectName);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);
    return { storageType: 'LOCAL_VAULT', location: filePath };
  }
}

/**
 * Retrieve Paper Buffer from Storage Vault
 */
async function getPaperObject(objectName) {
  if (useGcp && bucket) {
    const file = bucket.file(objectName);
    const [buffer] = await file.download();
    return buffer;
  } else {
    const filePath = path.join(LOCAL_VAULT_DIR, objectName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Storage object ${objectName} not found in private vault.`);
    }
    return await fs.promises.readFile(filePath);
  }
}

/**
 * Delete Paper Object from Storage Vault
 */
async function deletePaperObject(objectName) {
  if (useGcp && bucket) {
    await bucket.file(objectName).delete({ ignoreNotFound: true });
  } else {
    const filePath = path.join(LOCAL_VAULT_DIR, objectName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

module.exports = {
  savePaperObject,
  getPaperObject,
  deletePaperObject,
  isGcpStorage: () => useGcp
};
