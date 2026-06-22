import { supabase } from '../supabase';
import type {
  PersonalAccount,
  PersonalTransaction,
} from '../../types/database';

export async function getPinHash(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('personal_pin_hash')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return (data as { personal_pin_hash: string | null } | null)?.personal_pin_hash ?? null;
}

export async function setPinHash(userId: string, hash: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ personal_pin_hash: hash })
    .eq('id', userId);
  if (error) throw error;
}

export async function getAccounts(): Promise<PersonalAccount[]> {
  const { data, error } = await supabase
    .from('personal_accounts')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as PersonalAccount[]) ?? [];
}

export async function getAccount(id: string): Promise<PersonalAccount | null> {
  const { data, error } = await supabase
    .from('personal_accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as PersonalAccount) ?? null;
}

export async function createAccount(input: {
  account_name: string;
  account_type: PersonalAccount['account_type'];
  currency: string;
  opening_balance: number;
  notes?: string | null;
}): Promise<PersonalAccount> {
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('personal_accounts')
    .insert({
      ...input,
      owner_user_id: userRes.user?.id,
      current_balance: input.opening_balance,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PersonalAccount;
}

export async function getTransactions(
  accountId: string
): Promise<PersonalTransaction[]> {
  const { data, error } = await supabase
    .from('personal_transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data as PersonalTransaction[]) ?? [];
}

export async function addTransaction(input: {
  account_id: string;
  date: string;
  type: PersonalTransaction['type'];
  amount: number;
  category?: string | null;
  counterparty?: string | null;
  notes?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('personal_transactions').insert(input);
  if (error) throw error;

  // Recompute account balance from opening + transactions.
  const account = await getAccount(input.account_id);
  if (!account) return;
  const txns = await getTransactions(input.account_id);
  const delta = txns.reduce(
    (s, t) => s + (t.type === 'debit' ? -t.amount : t.amount),
    0
  );
  await supabase
    .from('personal_accounts')
    .update({ current_balance: account.opening_balance + delta })
    .eq('id', input.account_id);
}
