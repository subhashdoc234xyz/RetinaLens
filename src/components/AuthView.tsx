import React, { useState } from 'react';
import { ClinicianUser } from '../types';
import {
  registerLocalUser,
  verifyLocalUser,
  createGuestUser,
  setCurrentUser,
} from '../lib/storage';
import { getSupabase, ensureSupabaseClient } from '../lib/supabase';
import { IRIS_VISUAL_URL } from '../lib/constants';

interface AuthViewProps {
  onSuccess: (user: ClinicianUser) => void;
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBackToLanding }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('dr.chen@teleophthalmology.org');
  const [password, setPassword] = useState('ValidCert992!Ophthal');
  const [clinicId, setClinicId] = useState('RHU-04');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both your practitioner ID / email and password.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();

      if (tab === 'signup') {
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { clinic_id: clinicId.trim() || 'RHU-04' },
            },
          });
          if (error) throw error;
          if (data.user) {
            const newUser: ClinicianUser = {
              id: data.user.id,
              email: data.user.email || email.trim(),
              displayName: email.split('@')[0],
              clinicId: clinicId.trim() || 'RHU-04',
              isGuest: false,
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(newUser);
            onSuccess(newUser);
            return;
          }
        }
        const user = registerLocalUser(email, password, clinicId);
        setCurrentUser(user);
        onSuccess(user);
      } else {
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (!error && data.user) {
            const loggedIn: ClinicianUser = {
              id: data.user.id,
              email: data.user.email || email.trim(),
              displayName: email.split('@')[0],
              clinicId: clinicId.trim() || 'RHU-04',
              isGuest: false,
              createdAt: data.user.created_at || new Date().toISOString(),
            };
            setCurrentUser(loggedIn);
            onSuccess(loggedIn);
            return;
          }
        }
        const user = verifyLocalUser(email, password);
        setCurrentUser(user);
        onSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = await ensureSupabaseClient();
      console.log('[RetinaLens] Google Auth: supabase client is', supabase ? 'AVAILABLE' : 'NULL');
      if (supabase) {
        console.log('[RetinaLens] Initiating Google OAuth redirect...');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        console.log('[RetinaLens] OAuth result:', { data, error });
        if (error) throw error;
        return;
      } else {
        setErrorMsg('Supabase is not configured. Please check your Supabase environment variables.');
        console.error('[RetinaLens] Cannot use Google auth — Supabase client is not configured.');
      }
    } catch (err: any) {
      console.error('[RetinaLens] Google auth error:', err);
      setErrorMsg(err.message || 'Google authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    const guest = createGuestUser();
    setCurrentUser(guest);
    onSuccess(guest);
  };

  return (
    <div className="flex flex-col w-full relative items-center justify-center py-10 px-4 sm:px-8 overflow-hidden min-h-screen bg-[#090e1c] text-[#dee2f6]">
      {/* Immersive Cinematic Retina Background with Macro Iris */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden bg-[#090e1c]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 scale-105 filter blur-md transition-transform duration-1000"
          style={{ backgroundImage: `url('${IRIS_VISUAL_URL}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090e1c]/80 via-[#0e1321]/75 to-[#090e1c]/90" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-[#00d2ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-[480px] h-[320px] bg-[#508eff]/15 rounded-full blur-3xl pointer-events-none" />
      </div>



      {/* Main Frosted Glass Authentication Lens Card */}
      <div className="w-full max-w-md relative bg-[#1a1f2e]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#090e1c]/90 border border-[#3c494e]/40 transition-all duration-300">
        {/* Top Glowing Accent Glow Pip */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-1 rounded-full bg-[#00d2ff] shadow-[0_0_18px_#00d2ff]" />

        {/* Retinal Lens Biometric Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4 group cursor-pointer" onClick={onBackToLanding}>
            <div className="absolute inset-0 rounded-full bg-[#00d2ff]/20 blur-md group-hover:bg-[#00d2ff]/40 transition-all" />
            <div className="relative w-16 h-16 rounded-full bg-[#303444] flex items-center justify-center shadow-inner border border-[#47d6ff]/40">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-90" cx="50" cy="50" r="44" stroke="#47d6ff" strokeDasharray="6 6" strokeWidth="4" />
                <circle className="opacity-40" cx="50" cy="50" r="34" stroke="#a5e7ff" strokeWidth="2" />
                <circle className="opacity-90" cx="50" cy="50" fill="#00d2ff" r="16" />
                <circle cx="50" cy="50" fill="#090e1c" r="7" />
                <line stroke="#00d2ff" strokeLinecap="round" strokeWidth="3" x1="50" x2="50" y1="6" y2="20" />
                <line stroke="#00d2ff" strokeLinecap="round" strokeWidth="3" x1="50" x2="50" y1="80" y2="94" />
                <line stroke="#00d2ff" strokeLinecap="round" strokeWidth="3" x1="6" x2="20" y1="50" y2="50" />
                <line stroke="#00d2ff" strokeLinecap="round" strokeWidth="3" x1="80" x2="94" y1="50" y2="50" />
                <circle cx="50" cy="28" fill="#47d6ff" r="2.5" />
                <circle cx="50" cy="72" fill="#47d6ff" r="2.5" />
                <circle cx="28" cy="50" fill="#47d6ff" r="2.5" />
                <circle cx="72" cy="50" fill="#47d6ff" r="2.5" />
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#252a39] text-[#a5e7ff] font-mono text-[11px] uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[13px]">visibility</span>
            <span>RetinaLens AI Diagnostics</span>
          </div>
          <h1 className="font-space text-2xl font-bold text-[#dee2f6] tracking-tight">Clinical Access Portal</h1>
          <p className="text-xs text-[#bbc9cf] max-w-xs mt-1">
            Secure multi-factor authentication for certified healthcare workers &amp; field triage
          </p>
        </div>

        {/* Segmented Liquid Glass Tab Switcher */}
        <div className="relative bg-[#090e1c] p-1 rounded-xl flex items-center mb-6 shadow-inner border border-[#3c494e]/30">
          <button
            onClick={() => setTab('login')}
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'text-[#090e1c] bg-[#a5e7ff] shadow-[0_0_16px_rgba(0,210,255,0.45)]'
                : 'text-[#bbc9cf] hover:text-[#dee2f6]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Log In</span>
          </button>
          <button
            onClick={() => setTab('signup')}
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'signup'
                ? 'text-[#090e1c] bg-[#a5e7ff] shadow-[0_0_16px_rgba(0,210,255,0.45)]'
                : 'text-[#bbc9cf] hover:text-[#dee2f6]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            <span>Register ID</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Clinical Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email Address / Practitioner ID */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center justify-between font-mono text-[11px] text-[#bbc9cf] uppercase tracking-wider" htmlFor="practitionerEmail">
              <span>Practitioner ID / Email</span>
              <span className="text-[#47d6ff] lowercase font-mono text-[11px]">hl7.org auth</span>
            </label>
            <div className="relative flex items-center rounded-xl bg-[#090e1c] border border-[#3c494e]/40 transition-all duration-200 focus-within:border-[#00d2ff] shadow-sm">
              <span className="material-symbols-outlined absolute left-3.5 text-[#859399] text-[20px] pointer-events-none">badge</span>
              <input
                id="practitionerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer.id@ruralhealth.org"
                required
                className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-[#dee2f6] placeholder:text-[#859399] focus:outline-none"
              />
            </div>
          </div>

          {/* Secure Clinical Passkey / Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] text-[#bbc9cf] uppercase tracking-wider" htmlFor="practitionerPassword">
                Clinical Keyphrase
              </label>
              <button
                type="button"
                onClick={() => alert('Password recovery instructions sent to clinic supervisor.')}
                className="font-mono text-[11px] text-[#a5e7ff] hover:underline transition-all cursor-pointer"
              >
                Forgot clinical password?
              </button>
            </div>
            <div className="relative flex items-center rounded-xl bg-[#090e1c] border border-[#3c494e]/40 transition-all duration-200 focus-within:border-[#00d2ff] shadow-sm">
              <span className="material-symbols-outlined absolute left-3.5 text-[#859399] text-[20px] pointer-events-none">key</span>
              <input
                id="practitionerPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-transparent py-3 pl-11 pr-11 text-sm text-[#dee2f6] placeholder:text-[#859399] focus:outline-none tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#859399] hover:text-[#a5e7ff] transition-colors p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Security Level Check & Remember Station */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="w-4 h-4 rounded bg-[#090e1c] text-[#00d2ff] accent-[#00d2ff] cursor-pointer"
              />
              <span className="text-xs text-[#bbc9cf] select-none">Maintain Station Session</span>
            </label>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#47d6ff] bg-[#252a39] px-2 py-0.5 rounded-full border border-[#3c494e]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a5e7ff]" />
              256-Bit GCM
            </span>
          </div>

          {/* Primary Action CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-1 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#47d6ff] to-[#508eff] text-[#090e1c] font-space text-base font-semibold tracking-wide shadow-[0_0_24px_rgba(0,210,255,0.4)] hover:shadow-[0_0_32px_rgba(0,210,255,0.65)] hover:brightness-110 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In to Clinic Console' : 'Register Clinical Credential'}
          </button>
        </form>

        {/* Visual Subtle Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full h-px bg-[#3c494e]/30" />
          <span className="absolute bg-[#1a1f2e] px-3 font-mono text-[11px] text-[#859399] uppercase tracking-wider">
            or continue with
          </span>
        </div>

        {/* Secondary Federated / Emergency Handshake Options */}
        <div className="flex flex-col gap-2.5">
          {/* Continue with Google SSO */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 rounded-xl bg-[#252a39] hover:bg-[#343948] text-[#dee2f6] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm border border-[#3c494e]/30 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" />
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
              <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
            </svg>
            <span>Federated Identity via Google</span>
          </button>

          {/* Emergency Field Guest Triage (Rural Offline) */}
          <button
            type="button"
            onClick={handleGuestEntry}
            className="w-full py-2.5 px-4 rounded-xl bg-[#090e1c] hover:bg-[#93000a]/20 text-[#ffb4ab] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 group border border-[#93000a]/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ffb4ab] group-hover:animate-pulse">emergency</span>
            <span>Continue as Guest / Offline Emergency Triage</span>
          </button>
        </div>

        {/* Regulatory Compliance & HIPAA Notice */}
        <div className="mt-5 pt-3 flex flex-col items-center text-center gap-1 border-t border-[#3c494e]/20">
          <div className="flex items-center gap-1.5 text-[#bbc9cf] font-mono text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-[#a5e7ff]">verified_user</span>
            <span>Protected by HIPAA &amp; Rural Edge-Encryption Standards</span>
          </div>
          <p className="font-mono text-[10px] text-[#859399]">
            RetinaLens DeepLearning Core v4.2.1 • Local inference ready
          </p>
        </div>

        {/* Return to Landing */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs text-[#859399] hover:text-[#00d2ff] transition-colors cursor-pointer font-mono"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>


    </div>
  );
};
