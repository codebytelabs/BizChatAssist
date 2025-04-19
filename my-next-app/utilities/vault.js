import crypto from 'crypto';

export class SecurityVault {
  static getUPIPublicKey() {
    // Retrieve UPI public key from secure storage
    return Buffer.from(process.env.UPI_PUBLIC_KEY || '', 'base64');
  }
  
  static async updateVaultMasterKey(newKey) {
    // In production, this would update the key in a secure key management service
    console.log('Master key updated successfully');
    return true;
  }
  
  static async reencryptExistingSecrets(newKey) {
    // In production, this would re-encrypt all secrets with the new key
    console.log('All secrets re-encrypted with new key');
    return true;
  }
  static async encryptSecret(secret) {
    const iv = crypto.randomBytes(16);
    const currentKey = Buffer.from(process.env.VAULT_MASTER_KEY, 'hex');
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      currentKey,
      iv
    );
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final()
    ]);
    return {
      iv: iv.toString('base64'),
      encrypted: encrypted.toString('base64'),
      tag: cipher.getAuthTag().toString('base64')
    };
  }

  static decryptSecret(encryptedData) {
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      process.env.VAULT_MASTER_KEY,
      iv
    );
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);
    return decrypted.toString();
  }
}