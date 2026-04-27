import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useMyPermits(userId) {
  return useQuery({
    queryKey: ['permits', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('permits').select('*').eq('applicant_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useAllPermits() {
  return useQuery({
    queryKey: ['permits', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('permits').select('*, profiles(full_name, email, neighborhood)').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSubmitPermit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (permitData) => {
      const permitId = 'PRM-' + String(Math.floor(Math.random() * 99999)).padStart(5, '0')
      const { data, error } = await supabase.from('permits').insert([{ ...permitData, permit_id: permitId }]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permits'] }),
  })
}

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

/*export function usePermitByPlate(plate) {
  return useQuery({
    queryKey: ['permit-lookup', plate],
    queryFn: async () => {
      const { data, error } = await supabase.from('permits').select('*, profiles(full_name)').eq('vehicle_plate', plate.toUpperCase()).eq('status', 'Approved').single()
      if (error) return null
      return data
    },
    enabled: !!plate && plate.length > 3,
  })
}*/

export function usePermitByPlate(plate) {
  return useQuery({
    queryKey: ['permits', 'plate', plate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permits')
        .select('*')          // ← remove the profiles join entirely
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

