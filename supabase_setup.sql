-- =============================================================================
-- RetinaLens — Supabase PostgreSQL Schema
-- Explainable AI for Diabetic Retinopathy Screening
-- =============================================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- UUID generation (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigram search for patient ID fuzzy search (optional but useful)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CUSTOM ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

-- DR severity levels per ICDR scale
CREATE TYPE dr_severity AS ENUM ('0', '1', '2', '3', '4');

-- Eye side
CREATE TYPE eye_side AS ENUM ('OD', 'OS');

-- Pupil dilation status
CREATE TYPE pupil_status AS ENUM ('Dilated', 'Undilated');

-- Model source / inference engine
CREATE TYPE model_source AS ENUM (
  'matlab_edge_node',
  'tflite_int8',
  'gemini_clinical_core',
  'groq_llama_vision',
  'offline_heuristic'
);

-- Lesion finding type
CREATE TYPE lesion_type AS ENUM (
  'microaneurysms',
  'hemorrhages',
  'hard_exudates',
  'cotton_wool_spots',
  'neovascularization'
);

-- Lesion severity
CREATE TYPE lesion_severity AS ENUM ('minimal', 'moderate', 'extensive');

-- Grad-CAM primary attribution sector
CREATE TYPE attribution_sector AS ENUM (
  'macula',
  'superior_temporal',
  'inferior_temporal',
  'nasal',
  'foveal_avascular_zone'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROFILES TABLE (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  clinic_id     TEXT DEFAULT 'RHU-04',
  clinic_name   TEXT DEFAULT 'Rural Health Unit',
  is_guest      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, clinic_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'clinic_id', 'RHU-04')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile after auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SCANS TABLE (main clinical screening records)
-- Column names match exactly what storage.ts uses in .insert() and .select()
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scans (
  id                      TEXT PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id              TEXT NOT NULL,
  patient_age             INTEGER,
  eye_side                TEXT NOT NULL DEFAULT 'OD',
  pupil_dilation_status   TEXT DEFAULT 'Dilated',
  image_url               TEXT NOT NULL,
  gradcam_image_url       TEXT,
  uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dr_severity_level       INTEGER NOT NULL DEFAULT 0 CHECK (dr_severity_level BETWEEN 0 AND 4),
  dr_severity_label       TEXT NOT NULL DEFAULT 'Level 0 — No Diabetic Retinopathy',
  confidence_score        NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (confidence_score BETWEEN 0 AND 100),
  findings                JSONB NOT NULL DEFAULT '[]'::JSONB,
  explainability_notes    TEXT DEFAULT '',
  telemetry               JSONB NOT NULL DEFAULT '{}'::JSONB,
  live_output             JSONB,
  model_source            TEXT DEFAULT 'offline_heuristic',
  clinician_notes         TEXT DEFAULT '',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supports existing projects created before the Pipeline View was introduced.
ALTER TABLE scans ADD COLUMN IF NOT EXISTS live_output JSONB;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_uploaded_at ON scans(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_patient_id ON scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_scans_severity ON scans(dr_severity_level);
CREATE INDEX IF NOT EXISTS idx_scans_user_uploaded ON scans(user_id, uploaded_at DESC);

-- GIN index for JSONB findings search (e.g. finding lesions by type)
CREATE INDEX IF NOT EXISTS idx_scans_findings ON scans USING GIN (findings);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- ── Profiles Policies ──

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Scans Policies ──

-- Users can only read their own scans
CREATE POLICY "Users can view own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scans (e.g. adding clinician notes)
CREATE POLICY "Users can update own scans"
  ON scans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans"
  ON scans FOR DELETE
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET (for retinal fundus images)
-- ─────────────────────────────────────────────────────────────────────────────

-- Create a storage bucket for fundus scan images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fundus-images',
  'fundus-images',
  FALSE,
  26214400,  -- 25MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/dicom']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can upload to their own folder
CREATE POLICY "Users can upload fundus images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fundus-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Storage RLS: Users can view their own images
CREATE POLICY "Users can view own fundus images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fundus-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Storage RLS: Users can delete their own images
CREATE POLICY "Users can delete own fundus images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fundus-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. USEFUL DATABASE FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Get screening statistics for a clinician
CREATE OR REPLACE FUNCTION get_clinician_stats(clinician_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_scans', COUNT(*),
    'abnormal_count', COUNT(*) FILTER (WHERE dr_severity_level > 0),
    'referrals_count', COUNT(*) FILTER (WHERE dr_severity_level >= 2),
    'avg_confidence', ROUND(AVG(confidence_score)::NUMERIC, 1),
    'severity_distribution', json_build_object(
      'level_0', COUNT(*) FILTER (WHERE dr_severity_level = 0),
      'level_1', COUNT(*) FILTER (WHERE dr_severity_level = 1),
      'level_2', COUNT(*) FILTER (WHERE dr_severity_level = 2),
      'level_3', COUNT(*) FILTER (WHERE dr_severity_level = 3),
      'level_4', COUNT(*) FILTER (WHERE dr_severity_level = 4)
    ),
    'today_scans', COUNT(*) FILTER (WHERE uploaded_at::DATE = CURRENT_DATE),
    'this_week_scans', COUNT(*) FILTER (WHERE uploaded_at >= DATE_TRUNC('week', CURRENT_DATE))
  ) INTO result
  FROM scans
  WHERE user_id = clinician_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Search scans by patient ID (fuzzy match)
CREATE OR REPLACE FUNCTION search_patient_scans(
  clinician_id UUID,
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS SETOF scans AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM scans
  WHERE user_id = clinician_id
    AND (
      patient_id ILIKE '%' || search_query || '%'
      OR dr_severity_label ILIKE '%' || search_query || '%'
      OR clinician_notes ILIKE '%' || search_query || '%'
    )
  ORDER BY uploaded_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. SEED DATA (Optional — remove in production)
-- ─────────────────────────────────────────────────────────────────────────────

-- Uncomment below to insert a test scan after you've signed up with a real user.
-- Replace 'YOUR_USER_UUID' with your actual auth.users UUID from Supabase dashboard.

/*
INSERT INTO scans (id, user_id, patient_id, patient_age, eye_side, pupil_dilation_status, image_url, uploaded_at, dr_severity_level, dr_severity_label, confidence_score, findings, explainability_notes, telemetry, model_source)
VALUES (
  'scan_seed_001',
  'YOUR_USER_UUID'::UUID,
  'RL-8001',
  62,
  'OD',
  'Dilated',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Fundus_photograph_of_normal_right_eye.jpg/800px-Fundus_photograph_of_normal_right_eye.jpg',
  NOW(),
  0,
  'Level 0 — No Diabetic Retinopathy',
  97.2,
  '[{"id": "f1", "type": "microaneurysms", "label": "No Lesions", "severity": "minimal", "description": "No pathological features detected in fundus."}]'::JSONB,
  'Optical disc margins well-defined. Macula appears healthy with normal foveal reflex.',
  '{"focalRegionsCount": 2, "primaryAttributionSector": "macula", "featureWeights": [{"feature": "Vascular Caliber", "weightPercent": 84}, {"feature": "Foveal Zone", "weightPercent": 78}]}'::JSONB,
  'gemini_clinical_core'
);
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ SETUP COMPLETE
-- ─────────────────────────────────────────────────────────────────────────────
-- After running this SQL:
--
-- 1. Go to Supabase Dashboard → Settings → API
-- 2. Copy your Project URL → paste as VITE_SUPABASE_URL in .env
-- 3. Copy your anon/public key → paste as VITE_SUPABASE_ANON_KEY in .env
-- 4. Enable Google Auth: Authentication → Providers → Google → Enable
-- 5. Restart your dev server: pnpm run dev
-- ─────────────────────────────────────────────────────────────────────────────
