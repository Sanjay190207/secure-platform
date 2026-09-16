const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const LOCAL_VAULT_DIR = process.env.VERCEL
  ? path.join('/tmp', 'storage_vault')
  : path.join(__dirname, '../../storage_vault');

// Ensure local vault folder exists
if (!fs.existsSync(LOCAL_VAULT_DIR)) {
  fs.mkdirSync(LOCAL_VAULT_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Save Encrypted / Raw Paper Buffer to Storage Vault
 */
async function savePaperObject(objectName, buffer) {
  const filePath = path.join(LOCAL_VAULT_DIR, objectName);
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
  await fs.promises.writeFile(filePath, buffer);
  return { storageType: 'LOCAL_VAULT', location: filePath };
}

/**
 * Retrieve Paper Buffer from Storage Vault
 */
async function getPaperObject(objectName) {
  const filePath = path.join(LOCAL_VAULT_DIR, objectName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Storage object ${objectName} not found in private vault.`);
  }
  return await fs.promises.readFile(filePath);
}

/**
 * Delete Paper Object from Storage Vault
 */
async function deletePaperObject(objectName) {
  const filePath = path.join(LOCAL_VAULT_DIR, objectName);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}

module.exports = {
  savePaperObject,
  getPaperObject,
  deletePaperObject
};
