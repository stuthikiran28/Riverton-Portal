// src/hooks/useCitations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ─── RESIDENT: own citations only ─────────────────────────────
export function useMyCitations(userId) {
  return useQuery({
    // Namespaced key — never collides with 'all' or 'officer'
    queryKey: ['citations', 'mine', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .eq('resident_id', userId)
        .order('citation_date', { ascending: false })
      if (error) throw error
      // Always return an array — never undefined (v5 requires a value)
      return data ?? []
    },
    // Only runs when userId is a real non-empty value
    enabled: Boolean(userId),
  })
}

// ─── ADMIN: all citations ──────────────────────────────────────
export function useAllCitations() {
  return useQuery({
    // 'admin' prefix prevents key collision with 'mine' and 'officer'
    queryKey: ['citations', 'admin', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citations')
        .select('*, profiles!citations_officer_id_fkey(full_name)')
        .order('created_at', { ascending: false })
      // Remove the console.log before production
      if (error) throw error
      return data ?? []
    },
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
      // Invalidate only the specific officer's log and admin all-view
      // NOT the resident 'mine' queries — avoids triggering re-auth
      qc.invalidateQueries({ queryKey: ['citations', 'officer', variables.officer_id] })
      qc.invalidateQueries({ queryKey: ['citations', 'admin', 'all'] })
    },
  })
}

// ─── MUTATION: update a citation (refund claim, status) ───────
export function useUpdateCitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Select the updated row so callers can use the return value
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
      // Targeted invalidation: only refresh queries that touch this row
      if (updatedRow?.resident_id) {
        qc.invalidateQueries({
          queryKey: ['citations', 'mine', updatedRow.resident_id],
        })
      }
      qc.invalidateQueries({ queryKey: ['citations', 'admin', 'all'] })
    },
  })
}