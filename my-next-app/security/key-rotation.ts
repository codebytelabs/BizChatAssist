import * as crypto from 'crypto';
import { updateVaultMasterKey, reencryptExistingSecrets } from '../utilities/vault';

export async function rotateEncryptionKey() {
  const newKey = crypto.randomBytes(32);
  await updateVaultMasterKey(newKey);
  await reencryptExistingSecrets(newKey);
  return newKey;
}