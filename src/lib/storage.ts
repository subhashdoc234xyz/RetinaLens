import { ClinicianUser, ScanRecord } from '../types';
import { getSupabase } from './supabase';

const CURRENT_USER_KEY = 'retinalens_current_user';
const USERS_DB_KEY = 'retinalens_registered_users';
const FUNDUS_IMAGES_BUCKET = 'fundus-images';

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

/**
 * localStorage is deliberately limited to a few MB and is not suitable for
 * Base64 fundus images or Grad-CAM PNGs. Keep the offline cache to metadata;
 * the full scan is persisted through Supabase when it is configured.
 */
function toLocalCacheScan(scan: ScanRecord): ScanRecord {
  return {
    ...scan,
    imageUrl: '',
    gradcamImageUrl: undefined,
  };
}

function saveLocalScanCache(userId: string, scans: ScanRecord[]): void {
  const key = getScansStorageKey(userId);
  const compactScans = scans.map(toLocalCacheScan);

  try {
    localStorage.setItem(key, JSON.stringify(compactScans));
  } catch (error) {
    // Remove legacy entries that may contain oversized Base64 images and
    // retry once with the compact data.
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(compactScans));
      return;
    }
    throw error;
  }
}

function isDataUrl(value: string | undefined): boolean {
  return Boolean(value?.startsWith('data:'));
}

async function uploadDataUrl(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  dataUrl: string | undefined,
  path: string,
): Promise<string | undefined> {
  if (!dataUrl || !isDataUrl(dataUrl)) return dataUrl;

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const { error } = await supabase.storage
    .from(FUNDUS_IMAGES_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'image/png',
      upsert: true,
    });

  if (error) throw error;
  return path;
}

async function resolveStoredAssetUrl(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  value: string | undefined,
): Promise<string> {
  if (!value || isDataUrl(value) || value.startsWith('http')) return value || '';

  const { data, error } = await supabase.storage
    .from(FUNDUS_IMAGES_BUCKET)
    .createSignedUrl(value, 60 * 60);

  if (error || !data?.signedUrl) {
    console.warn('Could not create signed URL for stored scan image:', error);
    return '';
  }
  return data.signedUrl;
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
        return await Promise.all(data.map(async (row: any) => ({
          id: row.id,
          userId: row.user_id,
          patientId: row.patient_id,
          patientAge: row.patient_age,
          eyeSide: row.eye_side,
          pupilDilationStatus: row.pupil_dilation_status || 'Dilated',
          imageUrl: await resolveStoredAssetUrl(supabase, row.image_url),
          gradcamImageUrl: await resolveStoredAssetUrl(supabase, row.gradcam_image_url) || undefined,
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
        })));
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
  let persistedScan = scan;

  if (supabase) {
    try {
      const imagePath = `${scan.userId}/${scan.id}-fundus.png`;
      const gradcamPath = `${scan.userId}/${scan.id}-gradcam.png`;
      const [storedImageUrl, storedGradcamUrl] = await Promise.all([
        uploadDataUrl(supabase, scan.imageUrl, imagePath),
        uploadDataUrl(supabase, scan.gradcamImageUrl, gradcamPath),
      ]);

      persistedScan = {
        ...scan,
        imageUrl: storedImageUrl || scan.imageUrl,
        gradcamImageUrl: storedGradcamUrl,
      };

      const { error } = await supabase.from('scans').insert({
        id: persistedScan.id,
        user_id: persistedScan.userId,
        patient_id: persistedScan.patientId,
        eye_side: persistedScan.eyeSide,
        pupil_dilation_status: persistedScan.pupilDilationStatus,
        image_url: persistedScan.imageUrl,
        gradcam_image_url: persistedScan.gradcamImageUrl,
        uploaded_at: persistedScan.uploadedAt,
        dr_severity_level: persistedScan.drSeverityLevel,
        dr_severity_label: persistedScan.drSeverityLabel,
        confidence_score: persistedScan.confidenceScore,
        findings: persistedScan.findings,
        explainability_notes: persistedScan.explainabilityNotes,
        telemetry: persistedScan.telemetry,
        model_source: persistedScan.modelSource,
        clinician_notes: persistedScan.clinicianNotes,
      });
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase scan save error:', err);
    }
  }

  // Always keep isolated per-user local copy as offline-first cache
  if (typeof window === 'undefined') return;
  const existing = await getUserScans(scan.userId);
  const updated = [persistedScan, ...existing.filter((s) => s.id !== scan.id)];
  saveLocalScanCache(scan.userId, updated);
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
  saveLocalScanCache(userId, updated);
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
