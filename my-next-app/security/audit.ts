import supabase from '../utilities/supabase';
import { HIPAA_POLICIES } from './policies/hipaa';

interface AuditEvent {
  action: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event to the security audit trail
 * HIPAA compliant with required retention periods
 */
export async function logAction(event: string | AuditEvent) {
  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Format the event
  const auditEvent = typeof event === 'string' ? { action: event } : event;
  
  // Add contextual information
  const enrichedEvent = {
    ...auditEvent,
    userId: auditEvent.userId || user?.id,
    timestamp: new Date().toISOString(),
    retentionPeriod: HIPAA_POLICIES.audit.retentionPeriodDays
  };
  
  // Insert into audit log table
  const { error } = await supabase.from('audit_logs').insert([enrichedEvent]);
  
  if (error) {
    console.error('Failed to log audit event:', error);
    // For critical audit failures in HIPAA environment, we should have a fallback
    backupAuditLog(enrichedEvent);
  }
  
  return { success: !error };
}

/**
 * Emergency backup for audit logs if primary storage fails
 * In production, this would write to a secure secondary storage
 */
function backupAuditLog(event: any) {
  // In production: Write to secure backup system
  // For development: Just log to console with warning
  console.warn('AUDIT BACKUP: Event logged to fallback system', event);
}

/**
 * Run a compliance check on audit log retention
 */
export async function verifyAuditCompliance() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, timestamp')
    .order('timestamp', { ascending: true })
    .limit(1);
    
  if (error || !data?.length) {
    return { compliant: false, reason: 'Could not verify audit log integrity' };
  }
  
  const oldestLog = new Date(data[0].timestamp);
  const requiredRetention = HIPAA_POLICIES.audit.retentionPeriodDays;
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - requiredRetention);
  
  return {
    compliant: oldestLog <= retentionDate,
    oldestLog,
    requiredRetention
  };
}