// src/hooks/useCitations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const CITATIONS_PAGE_SIZE = 50

// ─── RESIDENT: own citations only ─────────────────────────────
export function useMyCitations(userId) {
  return useQuery({
    queryKey: ['citations', 'mine', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .eq('resident_id', userId)
        .order('citation_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(userId),
  })
}

// ─── ADMIN: paginated + exact total count ─────────────────────
export function useAllCitations(page = 0) {
  return useQuery({
    queryKey: ['citations', 'admin', 'all', page],
    queryFn: async () => {
      const from = page * CITATIONS_PAGE_SIZE
      const to   = from + CITATIONS_PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('citations')
        .select('*, profiles!citations_officer_id_fkey(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return { rows: data ?? [], total: count ?? 0 }
    },
    keepPreviousData: true,
  })
}

// ─── ADMIN: fetch ALL citations for KPIs / Overview ───────────
export function useAllCitationsFull() {
  return useQuery({
    queryKey: ['citations', 'admin', 'full'],
    queryFn: async () => {
      const PAGE = 1000
      let all = [], from = 0

      while (true) {
        const { data, error, count } = await supabase
          .from('citations')
          .select('*', { count: 'exact' })   // no join — faster & no row gaps
          .order('created_at', { ascending: false })
          .range(from, from + PAGE - 1)

        if (error) throw error

        all = [...all, ...(data ?? [])]

        // Stop when we've fetched everything
        if (all.length >= count || (data ?? []).length < PAGE) break

        from += PAGE
      }

      console.log('[useAllCitationsFull] total fetched:', all.length)
      return all
    },
    staleTime: 0,          // always re-fetch — no stale cache
    refetchOnMount: true,
  })
}

// ─── OFFICER: citations they issued ───────────────────────────
export function useOfficerCitations(officerId) {
  return useQuery({
    queryKey: ['citations', 'officer', officerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .eq('officer_id', officerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(officerId),
  })
}

// ─── MUTATION: issue a new citation ───────────────────────────
export function useIssueCitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (citationData) => {
      const citationId =
        'CIT-' + String(Math.floor(Math.random() * 99999)).padStart(5, '0')
      const { data, error } = await supabase
        .from('citations')
        .insert([{ ...citationData, citation_id: citationId }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['citations', 'officer', variables.officer_id] })
      qc.invalidateQueries({ queryKey: ['citations', 'admin'] })
    },
  })
}

// ─── MUTATION: update a citation ──────────────────────────────
export function useUpdateCitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('citations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (updatedRow) => {
      if (updatedRow?.resident_id) {
        qc.invalidateQueries({ queryKey: ['citations', 'mine', updatedRow.resident_id] })
      }
      qc.invalidateQueries({ queryKey: ['citations', 'admin'] })
    },
  })
}