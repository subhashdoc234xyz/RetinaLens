import { DRSeverityLevel, DRSeverityMeta } from '../types';

export const DR_SEVERITY_LEVELS: Record<DRSeverityLevel, DRSeverityMeta> = {
  0: {
    level: 0,
    code: 'NO_DR',
    name: 'Level 0 — No Diabetic Retinopathy',
    description: 'No apparent diabetic retinal abnormalities or lesions detected.',
    clinicalAction: 'Annual rescreening recommended in 12 months.',
    colorHex: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.14)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    badgeText: '#10b981',
  },
  1: {
    level: 1,
    code: 'MILD_NPDR',
    name: 'Level 1 — Mild NPDR',
    description: 'Isolated microaneurysms detected with no other observable diabetic vascular anomalies.',
    clinicalAction: 'Follow-up fundus exam recommended in 6 to 9 months.',
    colorHex: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.14)',
    badgeBorder: 'rgba(56, 189, 248, 0.4)',
    badgeText: '#7bd0ff',
  },
  2: {
    level: 2,
    code: 'MODERATE_NPDR',
    name: 'Level 2 — Moderate NPDR',
    description: 'Microaneurysms, dot-and-blot hemorrhages, and/or hard lipid exudates present, but less than severe criteria.',
    clinicalAction: 'Ophthalmologist referral within 3 to 6 months; glycemic optimization advised.',
    colorHex: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.14)',
    badgeBorder: 'rgba(245, 158, 11, 0.45)',
    badgeText: '#f59e0b',
  },
  3: {
    level: 3,
    code: 'SEVERE_NPDR',
    name: 'Level 3 — Severe NPDR',
    description: 'Meets 4-2-1 rule: severe intraretinal hemorrhages in 4 quadrants, definite venous beading in 2+ quadrants, or IRMA in 1+ quadrant.',
    clinicalAction: 'Urgent ophthalmological referral within 2 to 4 weeks. High risk of rapid progression.',
    colorHex: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.18)',
    badgeBorder: 'rgba(249, 115, 22, 0.5)',
    badgeText: '#f97316',
  },
  4: {
    level: 4,
    code: 'PROLIFERATIVE_DR',
    name: 'Level 4 — Proliferative DR (PDR)',
    description: 'Neovascularization of the disc (NVD) or elsewhere (NVE), pre-retinal/vitreous hemorrhage, or fibrovascular proliferation.',
    clinicalAction: 'Immediate specialist intervention (anti-VEGF / panretinal photocoagulation) required within 48-72 hours.',
    colorHex: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    badgeBorder: 'rgba(239, 68, 68, 0.55)',
    badgeText: '#ef4444',
  },
};

// High resolution Iris visual asset URL from Google Stitch
export const IRIS_VISUAL_URL = '/assets/iris_macro.png';
export const FUNDUS_SAMPLE_URL = '/assets/fundus_sample.png';
export const DOCTOR_AVATAR_URL = '/assets/doctor_avatar.png';
export const RETINALENS_LOGO_URL = '/assets/retinalens_logo.png';

