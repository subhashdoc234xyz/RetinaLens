import { ClinicianUser, ScanRecord } from '../types';
import { getSupabase } from './supabase';

const CURRENT_USER_KEY = 'retinalens_current_user';
const USERS_DB_KEY = 'retinalens_registered_users';

export function getCurrentUser(): ClinicianUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: ClinicianUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

// User-isolated scan storage
function getScansStorageKey(userId: string): string {
  return `retinalens_scans_${userId}`;
}

function getSearchHistoryKey(userId: string): string {
  return `retinalens_search_${userId}`;
}

export async function getUserScans(userId: string): Promise<ScanRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          patientId: row.patient_id,
          patientAge: row.patient_age,
          eyeSide: row.eye_side,
          pupilDilationStatus: row.pupil_dilation_status || 'Dilated',
          imageUrl: row.image_url,
          gradcamImageUrl: row.gradcam_image_url,
          uploadedAt: row.uploaded_at,
          drSeverityLevel: row.dr_severity_level,
          drSeverityLabel: row.dr_severity_label,
          confidenceScore: Number(row.confidence_score),
          findings: Array.isArray(row.findings) ? row.findings : [],
          explainabilityNotes: row.explainability_notes || '',
          telemetry: row.telemetry || {
            focalRegionsCount: 0,
            primaryAttributionSector: 'macula',
            featureWeights: [],
          },
          modelSource: row.model_source || 'matlab_edge_node',
          clinicianNotes: row.clinician_notes || '',
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to isolated local vault:', err);
    }
  }

  // Local per-user vault fallback
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getScansStorageKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveUserScan(scan: ScanRecord): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('scans').insert({
        id: scan.id,
        user_id: scan.userId,
        patient_id: scan.patientId,
        eye_side: scan.eyeSide,
        pupil_dilation_status: scan.pupilDilationStatus,
        image_url: scan.imageUrl,
        gradcam_image_url: scan.gradcamImageUrl,
        uploaded_at: scan.uploadedAt,
        dr_severity_level: scan.drSeverityLevel,
        dr_severity_label: scan.drSeverityLabel,
        confidence_score: scan.confidenceScore,
        findings: scan.findings,
        explainability_notes: scan.explainabilityNotes,
        telemetry: scan.telemetry,
        model_source: scan.modelSource,
        clinician_notes: scan.clinicianNotes,
      });
    } catch (err) {
      console.warn('Supabase scan save error:', err);
    }
  }

  // Always keep isolated per-user local copy as offline-first cache
  if (typeof window === 'undefined') return;
  const existing = await getUserScans(scan.userId);
  const updated = [scan, ...existing.filter((s) => s.id !== scan.id)];
  localStorage.setItem(getScansStorageKey(scan.userId), JSON.stringify(updated));
}

export async function deleteUserScan(userId: string, scanId: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('scans').delete().eq('id', scanId).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase scan delete error:', err);
    }
  }

  if (typeof window === 'undefined') return;
  const existing = await getUserScans(userId);
  const updated = existing.filter((s) => s.id !== scanId);
  localStorage.setItem(getScansStorageKey(userId), JSON.stringify(updated));
}

export function getUserSearchHistory(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getSearchHistoryKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserSearchQuery(userId: string, query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  const history = getUserSearchHistory(userId);
  const updated = [query.trim(), ...history.filter((q) => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 10);
  localStorage.setItem(getSearchHistoryKey(userId), JSON.stringify(updated));
}

// Local accounts database (strictly real user registered credentials, NEVER seeded with demo accounts)
export function getRegisteredUsers(): Record<string, { passwordHash: string; user: ClinicianUser }> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(USERS_DB_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function registerLocalUser(email: string, password: string, clinicId?: string): ClinicianUser {
  const users = getRegisteredUsers();
  const lowerEmail = email.toLowerCase().trim();
  if (users[lowerEmail]) {
    throw new Error('An account with this work email already exists.');
  }

  const newUser: ClinicianUser = {
    id: `clinician_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    email: lowerEmail,
    displayName: lowerEmail.split('@')[0],
    clinicId: clinicId?.trim() || 'CLINIC-RURAL-NODE-01',
    clinicName: 'Rural Health Ophthalmic Node',
    isGuest: false,
    createdAt: new Date().toISOString(),
  };

  users[lowerEmail] = {
    passwordHash: btoa(password), // Simple encoding for local authenticated state
    user: newUser,
  };

  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  return newUser;
}

export function verifyLocalUser(email: string, password: string): ClinicianUser {
  const users = getRegisteredUsers();
  const lowerEmail = email.toLowerCase().trim();
  const record = users[lowerEmail];
  if (!record) {
    throw new Error('No account found for this email address. Please sign up first.');
  }

  if (record.passwordHash !== btoa(password)) {
    throw new Error('Invalid clinician password.');
  }

  return record.user;
}

export function createGuestUser(): ClinicianUser {
  const guestUser: ClinicianUser = {
    id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: 'guest.clinician@ruralhealth.local',
    displayName: 'Guest Clinician',
    clinicId: 'GUEST-TRIAGE-NODE',
    clinicName: 'Offline Triage Node',
    isGuest: true,
    createdAt: new Date().toISOString(),
  };

  return guestUser;
}
