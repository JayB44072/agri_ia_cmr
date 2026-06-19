import { supabase } from '@/lib/supabase';

export type FinanceType = 'income' | 'expense';

export type FinanceRow = {
  id: string;
  owner_id: string;
  type: FinanceType;
  category: string;
  amount: number; // FCFA
  transaction_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at?: string;
};

export async function getFinancesByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('finances')
    .select('*')
    .eq('owner_id', ownerId)
    .order('transaction_date', { ascending: false });
  return { data: data as FinanceRow[] | null, error };
}

export async function createFinanceTransaction(transaction: Omit<FinanceRow, 'id'>) {
  const { data, error } = await supabase
    .from('finances')
    .insert([transaction])
    .select()
    .single();
  return { data: data as FinanceRow | null, error };
}

export async function updateFinanceTransaction(id: string, transaction: Partial<Omit<FinanceRow, 'id' | 'owner_id'>>) {
  const { data, error } = await supabase
    .from('finances')
    .update(transaction)
    .eq('id', id)
    .select()
    .single();
  return { data: data as FinanceRow | null, error };
}

export async function deleteFinanceTransaction(id: string) {
  const { error } = await supabase
    .from('finances')
    .delete()
    .eq('id', id);
  return { error };
}
