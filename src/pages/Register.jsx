import { useState, useId } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  Target,
  FolderKanban,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const fullNameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      await register(email, password, fullName)
      navigate('/dashboard') // Redirect after successful signup
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'peer w-full rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 ' +
    'border-zinc-200 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] ' +
    'focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 ' +
    'transition-[border-color,box-shadow,background-color] duration-150 ' +
    'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800'

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
        {/* ============================================================
            LEFT — FORM PANEL
        ============================================================ */}
        <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12 lg:px-16 xl:px-20">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-500/20">
              P
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              PropDesk
              <span className="text-indigo-600 dark:text-indigo-400"> CRM</span>
            </span>
          </div>

          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-[380px] lg:mx-0">
              {/* Heading */}
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <Sparkles size={11} className="text-indigo-500" />
                  Get started
                </div>
                <h1 className="text-[30px] font-bold leading-tight tracking-[-0.02em]">
                  Create your account
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Set up your workspace in less than a minute.
                </p>
              </div>

              {/* Error — live region */}
              <div aria-live="polite" className="min-h-0">
                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 dark:border-rose-500/30 dark:bg-rose-500/10"
                  >
                    <AlertCircle
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400"
                    />
                    <p
                      id={errorId}
                      className="text-[13px] font-medium leading-relaxed text-rose-700 dark:text-rose-300"
                    >
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div>
                  <label
                    htmlFor={fullNameId}
                    className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                    />
                    <input
                      id={fullNameId}
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`${inputBase} h-11 pl-10 pr-3.5 text-[14px]`}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? errorId : undefined}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor={emailId}
                    className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                    />
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputBase} h-11 pl-10 pr-3.5 text-[14px]`}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? errorId : undefined}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor={passwordId}
                    className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                    />
                    <input
                      id={passwordId}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputBase} h-11 pl-10 pr-11 text-[14px]`}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? errorId : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Minimum 6 characters.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="group relative mt-2 inline-flex h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-zinc-900 text-[14px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 active:bg-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:active:bg-indigo-700 dark:focus-visible:ring-offset-zinc-950"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Register
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-150 group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-zinc-50 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login link */}
              <Link
                to="/login"
                className="flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-[14px] font-medium text-zinc-800 transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-offset-zinc-950"
              >
                Sign in instead
              </Link>

              {/* Trust note */}
              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11.5px] text-zinc-400 dark:text-zinc-500 lg:justify-start">
                <ShieldCheck size={13} />
                Secured with encrypted transport
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] text-zinc-400 dark:text-zinc-500 lg:text-left">
            © {new Date().getFullYear()} PropDesk CRM. All rights reserved.
          </p>
        </main>

        {/* ============================================================
            RIGHT — BRAND SHOWCASE PANEL (desktop only)
        ============================================================ */}
        <aside className="relative hidden overflow-hidden lg:flex lg:w-[52%] xl:w-[54%]">
          {/* Base gradient — violet → indigo → blue (matches original register) */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600" />

          {/* Fine grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage:
                'radial-gradient(ellipse at 30% 20%, black, transparent 72%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at 30% 20%, black, transparent 72%)',
            }}
          />

          {/* Glow blobs */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-[380px] w-[380px] rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="pointer-events-none absolute right-1/3 top-1/3 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-sm font-bold backdrop-blur-sm">
                P
              </span>
              <span className="text-[15px] font-bold tracking-tight">
                PropDesk<span className="text-white/70"> CRM</span>
              </span>
            </div>

            {/* Pitch */}
            <div className="max-w-md">
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 backdrop-blur-sm">
                <Sparkles size={12} className="text-white/90" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/90">
                  Free to start
                </span>
              </div>

              <h2 className="text-[34px] font-bold leading-[1.08] tracking-[-0.02em] xl:text-[42px]">
                Your property business,
                <br />
                beautifully organized
                <br />
                <span className="text-white/70">from day one.</span>
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">
                Everything you need to run a real estate operation — from listings
                and leads to delivery — in one workspace.
              </p>

              {/* Feature chips */}
              <div className="mt-8 grid max-w-sm grid-cols-2 gap-2.5">
                {[
                  { icon: Building2, label: 'Properties' },
                  { icon: Users, label: 'Customers' },
                  { icon: Target, label: 'Leads' },
                  { icon: FolderKanban, label: 'Projects' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/15"
                  >
                    <Icon size={14} className="text-white/90" />
                    <span className="text-[12.5px] font-medium text-white/95">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust / quote */}
            <div className="max-w-md">
              <div className="flex gap-0.5 text-white/80" aria-hidden="true">
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i} className="text-[13px]">
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-2 max-w-sm text-[13px] italic leading-relaxed text-white/75">
                "We replaced three tools with PropDesk. The team hasn't looked back."
              </p>
              <p className="mt-2 text-[12px] font-medium text-white/60">
                — Property teams, worldwide
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}