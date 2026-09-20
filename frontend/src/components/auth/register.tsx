import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'

import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useRegister } from '#/hooks/use-auth'
import { Button } from '#/components/ui/button'

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { mutate: register, isPending, error: registerError } = useRegister()

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        setPasswordError('Passwords do not match')
        return
      }
      setPasswordError(null)
      const { confirmPassword, ...registerData } = value
      register({ data: registerData })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      {/* SERVER ERROR */}
      {registerError && (
        <Alert className="rounded-lg border-[#E05555]/25 bg-[#E05555]/[0.06] px-3 py-2.5">
          <AlertDescription className="text-xs text-[#E05555]">
            {registerError.message || 'Invalid email or password'}
          </AlertDescription>
        </Alert>
      )}

      {/* Username */}
      <form.Field
        name="username"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Username is required'
              : value.length < 3
                ? 'Username must be at least 3 characters'
                : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={field.name}
                  className="block text-[11px] font-medium text-[#B8B5C5]"
                >
                  Username
                </label>
              </div>
              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  placeholder="john doe"
                  autoComplete="username"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'outline-none',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />
              </div>
              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* EMAIL */}
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Email is required'
              : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ? 'Invalid email format'
                : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={field.name}
                  className="block text-[11px] font-medium text-[#B8B5C5]"
                >
                  Email
                </label>
              </div>
              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'outline-none',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />
              </div>
              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* PASSWORD */}
      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Password is required'
              : value.length < 6
                ? 'Password must be at least 6 characters'
                : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={field.name}
                  className="block text-[11px] font-medium text-[#B8B5C5]"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-[10px] text-[#4A4860] transition-colors duration-300 hover:text-[#E8A838] focus-visible:outline-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type={showPassword ? 'text' : 'password'}
                  value={field.state.value}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5 pr-10',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'outline-none',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4860] transition-colors duration-200 hover:text-[#B8B5C5] focus-visible:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* Confirm PASSWORD */}
      <form.Field
        name="confirmPassword"
        validators={{
          onChange: ({ value }) =>
            !value ? 'Please confirm your password' : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={field.name}
                  className="block text-[11px] font-medium text-[#B8B5C5]"
                >
                  Confirm Password
                </label>
              </div>

              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="new-password"
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5 pr-10',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'outline-none',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4860] transition-colors duration-200 hover:text-[#B8B5C5] focus-visible:outline-none cursor-pointer"
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>
      {passwordError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {passwordError ?? registerError?.message}
          </p>
        </div>
      )}
      {/* BUTTON */}
      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          'h-10 w-full rounded-lg cursor-pointer',
          'text-sm font-semibold',
          'bg-[#E8A838] text-[#0A0A0F]',
          'hover:bg-[#F0B848]',
          'transition-all duration-500',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
          'active:scale-[0.98]',
          'active:translate-y-0',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-[#E8A838]',
          'focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[#16161F]',
          'disabled:pointer-events-none',
          'disabled:opacity-50',
        )}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F]" />
            Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  )
}
