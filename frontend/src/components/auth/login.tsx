'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register'

interface FieldError {
  email?: string
  username?: string
  password?: string
  confirm?: string
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(mode: AuthMode, f: Record<string, string>): FieldError {
  const e: FieldError = {}
  if (!f.email) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = 'Enter a valid email'
  if (mode === 'register') {
    if (!f.username) e.username = 'Username is required'
    else if (f.username.length < 3) e.username = 'At least 3 characters'
    else if (!/^[a-z0-9_]+$/.test(f.username))
      e.username = 'Lowercase, numbers, underscores only'
  }
  if (!f.password) e.password = 'Password is required'
  else if (f.password.length < 8) e.password = 'At least 8 characters'
  if (mode === 'register' && f.password && f.confirm !== f.password)
    e.confirm = 'Passwords do not match'
  return e
}

// ── Password strength ─────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const segColors = [
    'bg-[#E05555]',
    'bg-[#E05555]',
    'bg-[#FEBC2E]',
    'bg-[#E8A838]',
    'bg-[#1D9E75]',
  ]

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-0.5 flex-1 rounded-full transition-all duration-500',
              i < score ? segColors[score] : 'bg-[#2A2A3A]',
            )}
          />
        ))}
      </div>
      <p className="text-[10px] text-[#4A4860]">{labels[score]}</p>
    </div>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  label: string
  id: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  autoComplete?: string
}) {
  const [showPw, setShowPw] = useState(false)
  const isPw = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7A7890]"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPw ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-10 text-sm rounded-lg',
            'bg-[#111118] border-[#2A2A3A] text-[#F5F0E8]',
            'placeholder:text-[#4A4860]',
            'transition-all duration-300',
            'focus-visible:ring-1 focus-visible:ring-[#E8A838] focus-visible:border-[#E8A838]',
            error &&
              'border-[#E05555] focus-visible:ring-[#E05555] focus-visible:border-[#E05555]',
          )}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#4A4860] hover:text-[#E8A838] transition-colors duration-300 focus-visible:outline-none"
          >
            {showPw ? 'hide' : 'show'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#E05555]">{error}</p>}
      {hint && !error && <p className="text-[10px] text-[#4A4860]">{hint}</p>}
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    const errs = validate('login', { email, password })
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? 'Invalid credentials')
        return
      }
      localStorage.setItem('tc_token', data.data.Token)
      window.location.href = '/app'
    } catch {
      setServerError('Connection failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <Alert className="border-[#E05555]/25 bg-[#E05555]/06 py-2.5 px-3 rounded-lg">
          <AlertDescription className="text-xs text-[#E05555]">
            {serverError}
          </AlertDescription>
        </Alert>
      )}
      <Field
        label="Email"
        id="l-email"
        type="email"
        placeholder="krishna@example.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
      />
      <Field
        label="Password"
        id="l-password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
      />
      <div className="flex justify-end -mt-1">
        <button
          type="button"
          className="text-[10px] text-[#4A4860] hover:text-[#E8A838] transition-colors duration-300 focus-visible:outline-none"
        >
          Forgot password?
        </button>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full h-10 rounded-lg text-sm font-semibold',
          'bg-[#E8A838] hover:bg-[#F0B848] text-[#0A0A0F]',
          'transition-all duration-500',
          'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
          'active:scale-[0.98] active:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-[#E8A838] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161F]',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </Button>
      <p className="text-[11px] text-center text-[#4A4860]">
        No account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-[#E8A838] hover:underline focus-visible:outline-none"
        >
          Create one
        </button>
      </p>
    </form>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    const errs = validate('register', { email, username, password, confirm })
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(
          data.error ?? 'Registration failed. Try a different email.',
        )
        return
      }
      localStorage.setItem('tc_token', data.data.Token)
      window.location.href = '/app'
    } catch {
      setServerError('Connection failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <Alert className="border-[#E05555]/25 bg-[#E05555]/06 py-2.5 px-3 rounded-lg">
          <AlertDescription className="text-xs text-[#E05555]">
            {serverError}
          </AlertDescription>
        </Alert>
      )}
      <Field
        label="Username"
        id="r-username"
        placeholder="krishna_grg"
        value={username}
        onChange={setUsername}
        error={errors.username}
        hint="Lowercase, numbers, underscores only"
        autoComplete="username"
      />
      <Field
        label="Email"
        id="r-email"
        type="email"
        placeholder="krishna@example.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
      />
      <div>
        <Field
          label="Password"
          id="r-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />
      </div>
      <Field
        label="Confirm password"
        id="r-confirm"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
        autoComplete="new-password"
      />
      <Button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full h-10 rounded-lg text-sm font-semibold',
          'bg-[#E8A838] hover:bg-[#F0B848] text-[#0A0A0F]',
          'transition-all duration-500',
          'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
          'active:scale-[0.98] active:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-[#E8A838] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161F]',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </Button>
      <p className="text-[11px] text-center text-[#4A4860]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-[#E8A838] hover:underline focus-visible:outline-none"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}

// ── Auth page ─────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 relative overflow-hidden">
      {/* ambient — matches landing hero glow exactly */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-[#E8A838]/08 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[320px] h-[180px] rounded-full bg-[#1D9E75]/04 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo — identical to NavBar */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-block no-underline"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-2xl font-semibold text-[#F5F0E8] tracking-tight">
              Thread<span className="text-[#E8A838]">Call</span>
            </span>
          </a>
          <p className="text-xs text-[#7A7890] mt-2 leading-5">
            {mode === 'login'
              ? 'Welcome back. Sign in to your workspace.'
              : 'Create your account. Your first workspace is free.'}
          </p>
        </div>

        {/* Card — matches HeroDemo card exactly */}
        <Card className="border-[#2A2A3A] bg-[#16161F] rounded-2xl overflow-hidden shadow-2xl">
          {/* Window chrome — same as HeroDemo */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border-b border-[#2A2A3A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-xs text-[#7A7890]">
              ThreadCall — {mode === 'login' ? 'sign in' : 'create account'}
            </span>
          </div>

          {/* Tab switcher */}
          <div className="px-5 pt-5">
            <div className="flex bg-[#111118] rounded-lg p-0.5 border border-[#2A2A3A]">
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-md',
                    'transition-all duration-400',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8A838]',
                    mode === m
                      ? 'bg-[#1C1C28] text-[#F5F0E8]'
                      : 'text-[#7A7890] hover:text-[#F5F0E8]',
                  )}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="px-5 pt-5 pb-5">
            {mode === 'login' ? (
              <LoginForm onSwitch={() => setMode('register')} />
            ) : (
              <RegisterForm onSwitch={() => setMode('login')} />
            )}
          </CardContent>

          <Separator className="bg-[#2A2A3A]" />

          <CardFooter className="px-5 py-4 flex justify-center">
            <p className="text-[10px] text-[#4A4860] text-center">
              By continuing you agree to our{' '}
              <a
                href="/terms"
                className="text-[#7A7890] hover:text-[#F5F0E8] transition-colors underline"
              >
                terms
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-[#7A7890] hover:text-[#F5F0E8] transition-colors underline"
              >
                privacy policy
              </a>
            </p>
          </CardFooter>
        </Card>

        {/* Back link */}
        <p className="text-center mt-6">
          <a
            href="/"
            className="text-[10px] text-[#4A4860] hover:text-[#7A7890] transition-colors duration-300 no-underline"
          >
            ← Back to threadcall.dev
          </a>
        </p>
      </div>
    </div>
  )
}
