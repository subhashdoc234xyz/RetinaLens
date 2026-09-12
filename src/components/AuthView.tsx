import React, { useState } from 'react';
import { RetinaLensLogo } from './RetinaLensLogo';
import { ClinicianUser } from '../types';
import {
  registerLocalUser,
  verifyLocalUser,
  createGuestUser,
  setCurrentUser,
} from '../lib/storage';
import { getSupabase } from '../lib/supabase';
import {
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  Building,
  Key,
  LogIn,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: (user: ClinicianUser) => void;
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBackToLanding }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [rememberNode, setRememberNode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both your work email and password.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();

      if (tab === 'signup') {
        // Sign Up flow
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                clinic_id: clinicId.trim() || 'CLINIC-RURAL-NODE',
              },
            },
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            const newUser: ClinicianUser = {
              id: data.user.id,
              email: data.user.email || email.trim(),
              displayName: email.split('@')[0],
              clinicId: clinicId.trim() || 'CLINIC-RURAL-NODE',
              isGuest: false,
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(newUser);
            onSuccess(newUser);
            return;
          }
        }

        // Local registered clinician account
        const user = registerLocalUser(email, password, clinicId);
        setCurrentUser(user);
        setSuccessMsg('Clinician account created successfully.');
        setTimeout(() => onSuccess(user), 400);
      } else {
        // Log In flow
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
              clinicId: clinicId.trim() || 'CLINIC-RURAL-NODE',
              isGuest: false,
              createdAt: data.user.created_at || new Date().toISOString(),
            };
            setCurrentUser(loggedIn);
            onSuccess(loggedIn);
            return;
          }
        }

        // Local verification
        const user = verifyLocalUser(email, password);
        setCurrentUser(user);
        onSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } else {
        // In preview when Supabase credentials aren't bound yet, guide user
        setErrorMsg(
          'Google Workspace OAuth requires Supabase project keys configured in your .env file (SUPABASE_URL and SUPABASE_ANON_KEY), or use Work Email login / Continue as Guest.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication could not be initiated.');
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
    <div className="relative z-10 w-full max-w-lg mx-auto my-auto py-8 px-4">
      {/* Centered Frosted Glass Card with Liquid Glass Styling (exact Google Stitch class structure) */}
      <div className="relative w-full rounded-2xl bg-[#060d23]/60 backdrop-blur-2xl border border-[#3b494b]/40 shadow-2xl overflow-hidden p-4 sm:p-6 md:p-8">
        {/* Precision Glowing Cyan Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-90" />

        <div className="flex flex-col gap-4 pt-1">
          {/* Header & Branding */}
          <div className="flex flex-col items-center text-center">
            <RetinaLensLogo size="lg" className="mb-2" />

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#222940]/70 border border-[#3b494b]/50 text-[#7bd0ff] text-[10px] font-semibold mb-2 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
              <span>CLINICAL TRIAGE V4.8</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#dbfcff] tracking-tight font-heading">
              RetinaLens Clinician Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#b9cacb] mt-1 max-w-xs">
              {tab === 'login'
                ? 'Sign in to access clinic diagnostic screening'
                : 'Register a clinical node credentials account'}
            </p>
          </div>

          {/* Segmented Glass Pill Switcher */}
          <div className="p-1 rounded-xl bg-[#2d344c]/60 border border-[#3b494b]/30 backdrop-blur-md flex items-center justify-between gap-1 shadow-inner">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#00f0ff] text-[#002022] shadow-md'
                  : 'text-[#b9cacb] hover:text-[#dbfcff]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
                tab === 'signup'
                  ? 'bg-[#00f0ff] text-[#002022] shadow-md'
                  : 'text-[#b9cacb] hover:text-[#dbfcff]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ffb4ab] mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 text-[#a7f3d0] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10b981]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Field: Work Email */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#dbe1ff] font-medium" htmlFor="work-email">
                  Work Email
                </label>
                <span className="text-[11px] text-[#7bd0ff]">NHS / Clinic ID</span>
              </div>
              <div className="relative flex items-center">
                <Building className="w-4 h-4 absolute left-3.5 text-[#7bd0ff] pointer-events-none" />
                <input
                  id="work-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. s.jenkins@ruralhealth.org"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181f35]/80 border border-[#3b494b]/40 text-[#dbfcff] text-sm placeholder:text-[#849495]/70 transition-all backdrop-blur-sm focus:outline-none focus:border-[#00f0ff] focus:bg-[#222940] focus:shadow-[0_0_16px_rgba(0,240,255,0.3)]"
                  required
                />
              </div>
            </div>

            {/* Field: Clinic ID if signing up */}
            {tab === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#dbe1ff] font-medium" htmlFor="clinic-id">
                  Clinic Node Code / Health Center ID
                </label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 absolute left-3.5 text-[#7bd0ff] pointer-events-none" />
                  <input
                    id="clinic-id"
                    type="text"
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    placeholder="e.g. CLINIC-RURAL-NODE-04"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181f35]/80 border border-[#3b494b]/40 text-[#dbfcff] text-sm placeholder:text-[#849495]/70 transition-all backdrop-blur-sm focus:outline-none focus:border-[#00f0ff] focus:bg-[#222940]"
                  />
                </div>
              </div>
            )}

            {/* Field: Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#dbe1ff] font-medium" htmlFor="clinician-pwd">
                Password
              </label>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 absolute left-3.5 text-[#7bd0ff] pointer-events-none" />
                <input
                  id="clinician-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#181f35]/80 border border-[#3b494b]/40 text-[#dbfcff] text-sm placeholder:text-[#849495]/70 transition-all backdrop-blur-sm focus:outline-none focus:border-[#00f0ff] focus:bg-[#222940] focus:shadow-[0_0_16px_rgba(0,240,255,0.3)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 rounded-md text-[#b9cacb] hover:text-[#7df4ff] transition-colors cursor-pointer"
                  aria-label="Toggle password view"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberNode}
                    onChange={(e) => setRememberNode(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#2d344c] border-[#3b494b]/60 accent-[#00f0ff] cursor-pointer"
                  />
                  <span className="text-[#b9cacb]">Remember node</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'To reset your password in Supabase, check your email or visit your Supabase dashboard.'
                    )
                  }
                  className="text-[#7bd0ff] hover:text-[#7df4ff] transition-colors hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a6e0] text-[#002022] text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,240,255,0.5)] hover:scale-[1.01] active:scale-[0.99] border border-[#7df4ff]/40 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {loading
                  ? 'Authenticating...'
                  : tab === 'login'
                  ? 'Sign In to Clinic Console'
                  : 'Create Clinician Account'}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="w-full h-px bg-[#3b494b]/40" />
            <span className="absolute px-3 bg-[#060d23]/80 backdrop-blur-md text-[11px] font-semibold text-[#b9cacb] uppercase tracking-wider">
              or continue with
            </span>
          </div>

          {/* Alternative Access Actions */}
          <div className="flex flex-col gap-2.5">
            {/* Google Workspace Auth Option */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-3 rounded-xl bg-[#222940]/60 hover:bg-[#2d344c]/80 border border-[#3b494b]/40 text-[#dbe1ff] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 hover:text-[#dbfcff] shadow-sm backdrop-blur-sm cursor-pointer"
            >
              <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  fill="#EA4335"
                />
                <path
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                  fill="#4285F4"
                />
                <path
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17.4C3.7 21.1 7.5 24 12 24z"
                  fill="#34A853"
                />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>

            {/* Guest / Offline Demo Mode */}
            <button
              type="button"
              onClick={handleGuestEntry}
              className="w-full py-2 px-3 rounded-xl bg-[#181f35]/30 hover:bg-[#181f35]/60 border border-[#3b494b]/30 text-[#7bd0ff] hover:text-[#dbfcff] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors backdrop-blur-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Continue as Guest</span>
            </button>
          </div>

          {/* Clinical Trust Guarantee Footer Note (exact Stitch structure) */}
          <div className="pt-2.5 flex flex-col items-center gap-1 bg-[#141b31]/50 border border-[#3b494b]/30 rounded-xl p-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[#b9cacb]">
              <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-[11px] tracking-tight text-[#dbe1ff] font-medium">
                HIPAA Compliant • End-to-End Encrypted Rural Health Node
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#849495]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff]" />
                AES-256 Retinal Store
              </span>
              <span className="text-[#2d344c]">•</span>
              <span>Edge Inference Ready</span>
            </div>
          </div>

          {/* Return to landing */}
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-center text-[11px] text-[#b9cacb]/70 hover:text-[#00f0ff] transition-colors mt-1 cursor-pointer"
          >
            ← Return to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
