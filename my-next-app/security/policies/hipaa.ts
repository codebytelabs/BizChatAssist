/**
 * HIPAA-Compliant Security Policies
 * Implements row-level security for healthcare data
 */
export const HIPAA_POLICIES = {
  // Row-level security policies for Supabase
  policies: [
    {
      // Patient data access control
      table: 'patient_records',
      name: 'tenant_isolation',
      predicate: 'auth.uid() = owner_id OR auth.uid() IN (SELECT provider_id FROM authorized_providers WHERE patient_id = id)'
    },
    {
      // Audit logging policy
      table: 'access_logs',
      name: 'append_only',
      predicate: 'true', // Anyone can insert logs
      restrictDelete: true,
      restrictUpdate: true
    },
    {
      // Data retention policy
      table: 'templates',
      name: 'client_rls',
      predicate: 'auth.uid() = owner_id'
    }
  ],
  
  // Encryption configuration
  encryption: {
    atRest: true,
    inTransit: true,
    keyRotationDays: 90
  },
  
  // Audit logging configuration
  audit: {
    logAllAccess: true,
    retentionPeriodDays: 2190 // 6 years per HIPAA requirements
  }
};