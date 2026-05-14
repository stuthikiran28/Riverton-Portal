// src/hooks/usePermits.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const PERMITS_PAGE_SIZE = 50

// ─── RESIDENT: own permits only ───────────────────────────────
export function useMyPermits(userId) {
  return useQuery({
    queryKey: ['permits', 'mine', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

// ─── ADMIN: paginated + exact total count ─────────────────────
export function useAllPermits(page = 0) {
  return useQuery({
    queryKey: ['permits', 'admin', 'all', page],
    queryFn: async () => {
      const from = page * PERMITS_PAGE_SIZE
      const to   = from + PERMITS_PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('permits')
        .select('*, profiles(full_name, email, neighborhood)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return { rows: data ?? [], total: count ?? 0 }
    },
    keepPreviousData: true,
  })
}

// ─── ADMIN: fetch ALL permits for KPIs / Overview ─────────────
export function useAllPermitsFull() {
  return useQuery({
    queryKey: ['permits', 'admin', 'full'],
    queryFn: async () => {
      const PAGE = 1000
      let all = [], from = 0

      while (true) {
        const { data, error, count } = await supabase
          .from('permits')
          .select('*', { count: 'exact' })   // no profiles join — faster & no row gaps
          .order('created_at', { ascending: false })
          .range(from, from + PAGE - 1)

        if (error) throw error

        all = [...all, ...(data ?? [])]

        // Stop when we've fetched everything
        if (all.length >= count || (data ?? []).length < PAGE) break

        from += PAGE
      }

      console.log('[useAllPermitsFull] total fetched:', all.length)
      return all
    },
    staleTime: 0,          // always re-fetch — no stale cache
    refetchOnMount: true,
  })
}

// ─── MUTATION: submit a new permit ────────────────────────────
export function useSubmitPermit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (permitData) => {
      const permitId = 'PRM-' + String(Math.floor(Math.random() * 99999)).padStart(5, '0')
      const { data, error } = await supabase
        .from('permits')
        .insert([{ ...permitData, permit_id: permitId }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permits'] }),
  })
}

// ─── MUTATION: update permit status ───────────────────────────
export function useUpdatePermitStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const updates = { status }
      if (status === 'Approved') {
        updates.approval_date = new Date().toISOString().split('T')[0]
        updates.latency_hrs = parseFloat(((Date.now() - new Date().setHours(0)) / 3600000).toFixed(1))
      }
      const { error } = await supabase.from('permits').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permits'] }),
  })
}

// ─── LOOKUP: permit by plate ───────────────────────────────────
export function usePermitByPlate(plate) {
  return useQuery({
    queryKey: ['permits', 'plate', plate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('vehicle_plate', plate.toUpperCase().trim())
        .in('status', ['Approved', 'Pending', 'Expired', 'Denied'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Permit lookup error:', error)
        return null
      }
      return data
    },
    enabled: !!plate && plate.trim().length > 2,
    retry: false,
  })
}