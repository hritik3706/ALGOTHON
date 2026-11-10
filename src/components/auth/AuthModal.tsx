import React, { useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { useToast } from '../common/Toast';
import { X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    isConfigured,
  } = useAuth();

  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    if (authModalMode === 'signin') {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMessage(error.message);
      } else {
        showToast('Signed in successfully');
        closeAuthModal();
      }
    } else {
      const { error, needsEmailConfirmation } = await signUpWithEmail(email, password);
      if (error) {
        setErrorMessage(error.message);
      } else if (needsEmailConfirmation) {
        setConfirmationMessage('Check your email for the confirmation link to complete sign up.');
      } else {
        showToast('Account created and signed in');
        closeAuthModal();
      }
    }

    setIsSubmitting(false);
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setErrorMessage(null);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-card p-6 sm:p-8 shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Glow aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-32 bg-accent/15 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-fg-muted hover:text-fg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="font-display text-3xl text-fg font-normal tracking-tight">
            {authModalMode === 'signin' ? (
              <>
                Sign in to <em className="italic text-accent">Algothon</em>
              </>
            ) : (
              <>
                Create your <em className="italic text-accent">Account</em>
              </>
            )}
          </h2>
          <p className="font-mono text-xs text-fg-muted">
            Sync your DSA practice graph and spaced schedule across devices.
          </p>
        </div>

        {/* Unconfigured Supabase Banner Warning */}
        {!isConfigured && (
          <div className="mb-6 p-3.5 rounded-xl bg-accent/10 border border-accent/30 text-xs font-mono text-fg space-y-2">
            <div className="flex items-center gap-2 text-accent font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Supabase Keys Required</span>
            </div>
            <p className="text-fg-muted text-[11px] leading-relaxed">
              Add your Supabase credentials to <code className="text-accent bg-surface-2 px-1 py-0.5 rounded">.env</code>:
            </p>
            <pre className="p-2 rounded bg-bg text-[10px] text-fg-faint overflow-x-auto select-all">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
            >
              Get free keys at Supabase.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirmation Alert */}
        {confirmationMessage && (
          <div className="mb-4 p-3 rounded-lg bg-accent/15 border border-accent/40 text-accent text-xs font-mono flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{confirmationMessage}</span>
          </div>
        )}

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={!isConfigured || isSubmitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-pill bg-surface-2 border border-border text-fg text-xs font-ui font-medium hover:bg-surface-2/80 hover:border-white/20 transition-all disabled:opacity-40"
          >
            {/* GitHub SVG */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={!isConfigured || isSubmitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-pill bg-surface-2 border border-border text-fg text-xs font-ui font-medium hover:bg-surface-2/80 hover:border-white/20 transition-all disabled:opacity-40"
          >
            {/* Google SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="w-full border-t border-border" />
          <span className="bg-surface px-3 font-mono text-[10px] text-fg-faint uppercase">
            or continue with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email address" required>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-card bg-surface-2 border border-border text-fg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              disabled={isSubmitting}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 shadow-glow font-semibold"
            disabled={isSubmitting || !isConfigured}
          >
            {isSubmitting
              ? 'Processing...'
              : authModalMode === 'signin'
              ? 'Sign in'
              : 'Create account'}
          </Button>
        </form>

        {/* Mode Toggle Footer */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          {authModalMode === 'signin' ? (
            <p className="font-ui text-xs text-fg-muted">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  openAuthModal('signup');
                }}
                className="text-accent hover:underline font-semibold"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="font-ui text-xs text-fg-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  openAuthModal('signin');
                }}
                className="text-accent hover:underline font-semibold"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
