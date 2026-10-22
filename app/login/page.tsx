'use client'

import { useState, useActionState } from 'react'
import { login, signup } from '@/app/actions/auth'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const [loginState, loginAction, isLoginPending] = useActionState(login, null)
  const [signupState, signupAction, isSignupPending] = useActionState(signup, null)

  const activeState = mode === 'login' ? loginState : signupState
  const isPending = mode === 'login' ? isLoginPending : isSignupPending

  return (
    <div className="auth-container">
      <div className="card">
        <div className="card-header">
          <div className="badges-row" style={{ marginBottom: '0.75rem' }}>
            <span className="badge badge-client">Client Component (Interactive Form + State)</span>
          </div>
          <h1 className="card-title">Next.js + Supabase Playground</h1>
          <p className="card-description">
            {mode === 'login'
              ? 'Sign in to access your private task board.'
              : 'Create a new account to test Supabase Auth and RLS.'}
          </p>
        </div>

        {/* Tab switch between Login and Signup */}
        <div className="tabs" role="tablist">
          <button
            type="button"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
            id="tab-login"
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
            id="tab-signup"
          >
            Create Account
          </button>
        </div>

        {/* Error or Success notification */}
        {activeState?.error && (
          <div className="alert alert-error" role="alert">
            {activeState.error}
          </div>
        )}
        {activeState?.message && (
          <div className="alert alert-success" role="status">
            {activeState.message}
          </div>
        )}

        {/* Auth Form */}
        <form action={mode === 'login' ? loginAction : signupAction}>
          <div className="form-group">
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary btn-block"
            id="auth-submit-btn"
          >
            {isPending
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign In'
              : 'Sign Up'}
          </button>
        </form>
      </div>

      {/* Educational Guide Box */}
      <div className="concept-box" style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          💡 How Auth works in this playground:
        </h2>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <li>
            <strong>Server Actions:</strong> Form submissions invoke <code>login</code> or <code>signup</code> in <code>app/actions/auth.ts</code>. Credentials are sent directly to the server.
          </li>
          <li>
            <strong>Cookie Sessions:</strong> <code>@supabase/ssr</code> securely writes the authentication token into an HTTP-only cookie.
          </li>
          <li>
            <strong>Route Guard:</strong> <code>proxy.ts</code> checks the session cookie before rendering protected routes like <code>/tasks</code>.
          </li>
        </ul>
      </div>
    </div>
  )
}
