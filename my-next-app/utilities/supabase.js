import { createClient } from '@supabase/supabase-js';
import { SecurityVault } from './vault';
import { HIPAA_POLICIES } from '../security/policies/hipaa';

const encryptedUrl = process.env.SUPABASE_URL_ENCRYPTED;
const encryptedKey = process.env.SUPABASE_KEY_ENCRYPTED;

const supabaseUrl = SecurityVault.decryptSecret(JSON.parse(encryptedUrl));
const supabaseKey = SecurityVault.decryptSecret(JSON.parse(encryptedKey));
const supabase = createClient(supabaseUrl, supabaseKey).withRLS(HIPAA_POLICIES);
export default supabase;

export async function saveTemplate(template) {
  const { user } = await supabase.auth.getUser();
  const { data } = await supabase
    .from('templates')
    .insert([{ ...template, owner_id: user.id }]);
  return data;
}