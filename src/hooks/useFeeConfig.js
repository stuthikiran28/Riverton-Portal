// src/hooks/useFeeConfig.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useFeeConfig() {
  return useQuery({
    queryKey: ['fee_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_config')
        .select('*')
        .order('type')
      if (error) throw error
      return data
    },
  })
}

export function usePermitFees() {
  const { data = [], ...rest } = useFeeConfig()
  const fees = data
    .filter(r => r.type === 'permit')
    .reduce((acc, r) => ({ ...acc, [r.violation_type]: r.fee_amount }), {})
  return { data: fees, ...rest }
}

export function useCitationFees() {
  const { data = [], ...rest } = useFeeConfig()
  const fees = data
    .filter(r => r.type === 'citation')
    .reduce((acc, r) => ({ ...acc, [r.violation_type]: r.fee_amount }), {})
  return { data: fees, ...rest }
}

export function useUpdateFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, violation_type, fee_amount }) => {
      const { error } = await supabase
        .from('fee_config')
        .update({ violation_type, fee_amount: Number(fee_amount) })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee_config'] }),
  })
}

export function useAddFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ type, violation_type, fee_amount }) => {
      const { error } = await supabase
        .from('fee_config')
        .insert([{ type, violation_type, fee_amount: Number(fee_amount) }])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee_config'] }),
  })
}

export function useDeleteFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('fee_config')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee_config'] }),
  })
}