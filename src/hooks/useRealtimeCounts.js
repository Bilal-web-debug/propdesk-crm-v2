import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribes to Supabase Realtime changes on the given tables.
 * Calls `onChange` (debounced) whenever any table changes.
 *
 * Requires Realtime to be enabled on these tables in Supabase.
 * Gracefully degrades if Realtime is unavailable — nothing fires.
 */
export default function useRealtimeCounts(tables, onChange, debounceMs = 400) {
  const timeoutRef = useRef(null)
  const onChangeRef = useRef(onChange)

  // Keep callback ref current without resubscribing
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    const schedule = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => onChangeRef.current?.(), debounceMs)
    }

    const channel = supabase.channel('dashboard-realtime')

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => schedule()
      )
    })

    channel.subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
    // tables is expected to be a stable array — caller memoizes it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceMs])
}