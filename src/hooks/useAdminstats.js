import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ── Single profile by user ID ──────────────────────────────────
export function useProfileById(userId) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) return null
      return data
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}