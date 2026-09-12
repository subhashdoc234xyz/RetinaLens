/**
 * RetinaLens - Explainable AI for Diabetic Retinopathy Screening
 * Type definitions for clinical triage and edge inference telemetry
 */

export type DRSeverityLevel = 0 | 1 | 2 | 3 | 4;

export interface DRSeverityMeta {
  level: DRSeverityLevel;
  code: string;
  name: string;
  description: string;
  clinicalAction: string;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export interface LesionFinding {
  id: string;
  type: 'microaneurysms' | 'hemorrhages' | 'hard_exudates' | 'cotton_wool_spots' | 'neovascularization';
  label: string;
  severity: 'minimal' | 'moderate' | 'extensive';
  coordinates?: { x: number; y: number; radius?: number }; // Percentage coordinates on fundus canvas
  description: string;
}

export interface GradCamTelemetry {
  focalRegionsCount: number;
  primaryAttributionSector: 'macula' | 'superior_temporal' | 'inferior_temporal' | 'nasal' | 'foveal_avascular_zone';
  featureWeights: {
    feature: string;
    weightPercent: number;
  }[];
}

export interface ScanRecord {
  id: string;
  userId: string;
  patientId: string;
  patientAge?: number;
  eyeSide: 'OD' | 'OS'; // OD = Right Eye, OS = Left Eye
  pupilDilationStatus: 'Dilated' | 'Undilated';
  imageUrl: string;
  gradcamImageUrl?: string;
  uploadedAt: string;
  drSeverityLevel: DRSeverityLevel;
  drSeverityLabel: string;
  confidenceScore: number; // 0 to 100
  findings: LesionFinding[];
  explainabilityNotes: string;
  telemetry: GradCamTelemetry;
  modelSource: 'matlab_edge_node' | 'tflite_int8' | 'gemini_clinical_core' | 'offline_heuristic';
  clinicianNotes?: string;
}

export interface ClinicianUser {
  id: string;
  email: string;
  displayName: string;
  clinicId?: string;
  clinicName?: string;
  isGuest: boolean;
  createdAt: string;
}

export interface ModelEndpointConfig {
  modelApiUrl: string;
  isConnected: boolean;
  modelEngine: string;
  latencyMs: number;
  lastTestedAt?: string;
}

export type ActiveView = 'landing' | 'auth' | 'dashboard' | 'results' | 'history';
