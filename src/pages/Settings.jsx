import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Phone, Mail, Shield, Loader2, CheckCircle2, Lock, Copy, Check, Fingerprint,
} from 'lucide-react'

/* ============================================================
   STYLE TOKENS
   ============================================================ */
const CARD =
  'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800/80 dark:bg-zinc-900'

const INPUT =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800/40 dark:disabled:text-zinc-400'

const LABEL = 'mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300'

const EMPTY_PROFILE = { full_name: '', phone: '', role: '' }

const roleLabel = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : '')

/* ============================================================
   PRESENTATIONAL HELPERS
   ============================================================ */
function Avatar({ initial, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-md shadow-indigo-500/25 ${className}`}
    >
      {initial}
    </div>
  )
}

function InputField({ id, label, labelExtra, icon: Icon, hint, className = '', ...props }) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className={`${LABEL} flex items-center gap-2`}>
        {label}
        {labelExtra}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          />
        )}
        <input
          id={id}
          aria-describedby={hintId}
          className={`${INPUT} ${Icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, last = false, children }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 ${
        last ? '' : 'border-b border-zinc-100 dark:border-zinc-800'
      }`}
    >
      <dt className="flex shrink-0 items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
        <Icon size={14} aria-hidden="true" />
        {label}
      </dt>
      <dd className="min-w-0 text-right text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
        {children}
      </dd>
    </div>
  )
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Settings() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [saved, setSaved] = useState({ full_name: '', phone: '' }) // last known stored values
  const [profileExists, setProfileExists] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  /* ---------- Load profile ---------- */
  useEffect(() => {
    if (!user) return
    let cancelled = false

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (!cancelled && data) {
          const next = {
            full_name: data.full_name || '',
            phone: data.phone || '',
            role: data.role || 'agent',
          }
          setProfile(next)
          setSaved({ full_name: next.full_name, phone: next.phone })
          setProfileExists(true)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    })()

    return () => { cancelled = true }
  }, [user])

  /* ---------- Copy feedback reset ---------- */
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  /* ---------- Handlers ---------- */
  const setField = (key) => (e) => {
    const value = e.target.value
    setProfile((p) => ({ ...p, [key]: value }))
  }

  const discardChanges = () => {
    setProfile((p) => ({ ...p, full_name: saved.full_name, phone: saved.phone }))
  }

  async function updateProfile(e) {
    e.preventDefault()
    if (!user) return
    try {
      setSaving(true)

      const payload = { full_name: profile.full_name, phone: profile.phone }

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existing) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{ id: user.id, ...payload, role: 'admin' }])
        if (error) throw error
        setProfile((p) => ({ ...p, role: 'admin' }))
        setProfileExists(true)
      }

      setSaved({ full_name: payload.full_name, phone: payload.phone })
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function copyUserId() {
    if (!user?.id) return
    try {
      await navigator.clipboard.writeText(user.id)
      setCopied(true)
      toast.success('User ID copied')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  /* ---------- Derived ---------- */
  const busy = saving || loadingProfile
  const isDirty = profile.full_name !== saved.full_name || profile.phone !== saved.phone
  // With no profile row yet, Save is always enabled so the first save can create one
  const canSave = !busy && (!profileExists || isDirty)

  const initial = (
    profile.full_name?.trim().charAt(0) || user?.email?.charAt(0) || 'U'
  ).toUpperCase()

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12 animate-fade-up">

      {/* ---------- Header ---------- */}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile and account details.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">

        {/* ---------- Profile card ---------- */}
        <section aria-labelledby="profile-heading" className={`${CARD} overflow-hidden lg:col-span-2`}>

          {/* Identity banner */}
          <div className="flex items-center gap-4 border-b border-zinc-200/70 bg-gradient-to-br from-zinc-50 via-white to-indigo-50/50 p-6 dark:border-zinc-800 dark:from-zinc-800/40 dark:via-zinc-900 dark:to-indigo-500/5">
            <div className="relative shrink-0">
              <Avatar initial={initial} className="h-16 w-16 text-2xl" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white dark:bg-zinc-900 dark:ring-zinc-900">
                <CheckCircle2 size={14} className="text-emerald-500" aria-hidden="true" />
              </span>
            </div>

            <div className="min-w-0">
              {loadingProfile ? (
                <span className="block h-5 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
              ) : (
                <h2 id="profile-heading" className="truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {profile.full_name || 'Your name'}
                </h2>
              )}
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                <Mail size={13} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
              {profile.role && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/20">
                  <Shield size={10} aria-hidden="true" />
                  {roleLabel(profile.role)}
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={updateProfile} className="space-y-6 p-6" aria-busy={busy}>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Personal information</h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Your display name and contact number.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                id="full_name"
                label="Full name"
                icon={User}
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={profile.full_name}
                onChange={setField('full_name')}
                disabled={busy}
              />
              <InputField
                id="phone"
                label="Phone number"
                icon={Phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+92 300 1234567"
                value={profile.phone}
                onChange={setField('phone')}
                disabled={busy}
                className="tabular-nums"
              />
            </div>

            <InputField
              id="role"
              label="Role"
              labelExtra={
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <Lock size={10} aria-hidden="true" />
                  Read-only
                </span>
              }
              icon={Shield}
              hint="Only an administrator can change roles."
              type="text"
              value={roleLabel(profile.role)}
              disabled
            />

            {/* Action bar */}
            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
                {loadingProfile
                  ? 'Loading your profile…'
                  : isDirty
                    ? 'You have unsaved changes.'
                    : 'All changes are saved.'}
              </p>

              <div className="flex items-center gap-2 sm:justify-end">
                {isDirty && (
                  <button
                    type="button"
                    onClick={discardChanges}
                    disabled={saving}
                    className="h-10 rounded-xl px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    Discard
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!canSave}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none dark:focus-visible:ring-offset-zinc-900"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* ---------- Account details ---------- */}
        <aside aria-labelledby="account-heading" className={`${CARD} p-6 lg:col-span-1`}>
          <h2 id="account-heading" className="text-sm font-semibold text-zinc-900 dark:text-white">
            Account
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Read-only details from your session.
          </p>

          <dl className="mt-4">
           <InfoRow icon={Mail} label="Email">
              <span className="block truncate" title={user?.email || ''}>{user?.email || '—'}</span>
            </InfoRow>

            <InfoRow icon={Shield} label="Role">
              {roleLabel(profile.role) || '—'}
            </InfoRow>

            <InfoRow icon={Fingerprint} label="User ID" last>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400" title={user?.id || ''}>
                  {user?.id ? `${user.id.slice(0, 8)}…` : '—'}
                </span>
                {user?.id && (
                  <button
                    type="button"
                    onClick={copyUserId}
                    aria-label="Copy user ID"
                    title="Copy user ID"
                    className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                  </button>
                )}
              </span>
            </InfoRow>
          </dl>
        </aside>
      </div>
    </div>
  )
}