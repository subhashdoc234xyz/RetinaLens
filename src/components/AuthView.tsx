import React, { useState } from 'react';
import { ensureSupabaseClient } from '../lib/supabase';
import { IRIS_VISUAL_URL } from '../lib/constants';

interface AuthViewProps {
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onBackToLanding }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = await ensureSupabaseClient();
      if (!supabase) {
        throw new Error('Google sign-in is not configured for this app yet. Please contact the administrator.');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: 'select_account' } },
      });
      if (error) {
        if (/provider is not enabled|unsupported provider/i.test(error.message)) {
          throw new Error('Google sign-in has not been enabled in Supabase. Enable Google under Authentication → Providers, then add its Google OAuth client ID and secret.');
        }
        throw error;
      }
    } catch (err: any) {
      console.error('[RetinaLens] Google authentication error:', err);
      setErrorMsg(err.message || 'Google authentication could not be started. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full relative items-center justify-center py-10 px-4 sm:px-8 overflow-hidden min-h-screen bg-[#090e1c] text-[#dee2f6]">
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden bg-[#090e1c]">
        <div className="absolute inset-0 bg-cover bg-center opacity-45 scale-105 filter blur-md" style={{ backgroundImage: `url('${IRIS_VISUAL_URL}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090e1c]/80 via-[#0e1321]/75 to-[#090e1c]/90" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-[#00d2ff]/15 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative bg-[#1a1f2e]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#090e1c]/90 border border-[#3c494e]/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-1 rounded-full bg-[#00d2ff] shadow-[0_0_18px_#00d2ff]" />
        <div className="flex flex-col items-center text-center mb-6">
          <button type="button" aria-label="Back to landing page" className="relative mb-4 group" onClick={onBackToLanding}>
            <div className="absolute inset-0 rounded-full bg-[#00d2ff]/20 blur-md group-hover:bg-[#00d2ff]/40 transition-all" />
            <div className="relative w-16 h-16 rounded-full bg-[#303444] flex items-center justify-center shadow-inner border border-[#47d6ff]/40">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="44" stroke="#47d6ff" strokeDasharray="6 6" strokeWidth="4" /><circle cx="50" cy="50" r="34" stroke="#a5e7ff" strokeWidth="2" opacity=".4" /><circle cx="50" cy="50" fill="#00d2ff" r="16" /><circle cx="50" cy="50" fill="#090e1c" r="7" /></svg>
            </div>
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#252a39] text-[#a5e7ff] font-mono text-[11px] uppercase tracking-wider mb-2">RetinaLens AI Diagnostics</div>
          <h1 className="font-space text-2xl font-bold text-[#dee2f6] tracking-tight">Welcome to RetinaLens</h1>
          <p className="text-xs text-[#bbc9cf] max-w-xs mt-1">Use your Google account to securely access your screening workspace.</p>
        </div>
        <div className="relative bg-[#090e1c] p-1 rounded-xl flex items-center mb-6 shadow-inner border border-[#3c494e]/30">
          <button onClick={() => setMode('signin')} type="button" className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signin' ? 'text-[#090e1c] bg-[#a5e7ff] shadow-[0_0_16px_rgba(0,210,255,0.45)]' : 'text-[#bbc9cf]'}`}>Sign in</button>
          <button onClick={() => setMode('signup')} type="button" className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'text-[#090e1c] bg-[#a5e7ff] shadow-[0_0_16px_rgba(0,210,255,0.45)]' : 'text-[#bbc9cf]'}`}>Sign up</button>
        </div>
        {errorMsg && <div role="alert" className="mb-4 p-3 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs leading-relaxed">{errorMsg}</div>}
        <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#1a1f2e] text-sm font-semibold transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" /><path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" /><path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" /><path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" /></svg>
          {loading ? 'Connecting to Google…' : mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
        </button>
        <p className="mt-5 pt-4 text-center text-xs text-[#859399] border-t border-[#3c494e]/20">New Google accounts are registered automatically.</p>
        <div className="mt-3 text-center"><button type="button" onClick={onBackToLanding} className="text-xs text-[#859399] hover:text-[#00d2ff] transition-colors font-mono">← Back to Landing Page</button></div>
      </div>
    </div>
  );
};
