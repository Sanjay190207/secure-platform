const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const LOCAL_VAULT_DIR = process.env.VERCEL
  ? path.join('/tmp', 'storage_vault')
  : path.join(__dirname, '../../storage_vault');

// Global In-Memory Vault for Serverless Function Persistence
const memoryVault = new Map();

// Ensure local vault folder exists if possible
try {
  if (!fs.existsSync(LOCAL_VAULT_DIR)) {
    fs.mkdirSync(LOCAL_VAULT_DIR, { recursive: true, mode: 0o700 });
  }
} catch (e) {
  // Ignored in restricted environments
}

/**
 * Save Encrypted / Raw Paper Buffer to Storage Vault
 */
async function savePaperObject(objectName, buffer) {
  memoryVault.set(objectName, buffer);

  try {
    const filePath = path.join(LOCAL_VAULT_DIR, objectName);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);
  } catch (e) {
    // Memory vault handles serverless environment
  }

  return { storageType: 'VAULT_STORE', location: objectName };
}

/**
 * Retrieve Paper Buffer from Storage Vault
 */
async function getPaperObject(objectName) {
  if (memoryVault.has(objectName)) {
    return memoryVault.get(objectName);
  }

  try {
    const filePath = path.join(LOCAL_VAULT_DIR, objectName);
    if (fs.existsSync(filePath)) {
      return await fs.promises.readFile(filePath);
    }
  } catch (e) {
    // Fall through to error
  }

  throw new Error(`Storage object ${objectName} not found in private vault.`);
}

/**
 * Delete Paper Object from Storage Vault
 */
async function deletePaperObject(objectName) {
  memoryVault.delete(objectName);
  try {
    const filePath = path.join(LOCAL_VAULT_DIR, objectName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (e) {
    // Ignored
  }
}

module.exports = {
  savePaperObject,
  getPaperObject,
  deletePaperObject
};
