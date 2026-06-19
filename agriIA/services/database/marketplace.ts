import { supabase } from '@/lib/supabase';

export type ProductRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  price: number; // FCFA
  unit: string; // kg, sac, régime, etc.
  quantity: number;
  city: string | null;
  region: string | null;
  phone: string | null;
  crop: string | null;
  image_url: string | null;
  created_at?: string;
};

export type WalletRow = {
  id: string;
  owner_id: string;
  phone: string;
  carrier: 'MTN' | 'Orange';
  balance: number;
  created_at?: string;
};

export type WalletTransactionRow = {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'receive';
  amount: number;
  description: string | null;
  reference: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
};

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data as ProductRow[] | null, error };
}

export async function getProductsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data: data as ProductRow[] | null, error };
}

export async function createProduct(product: Omit<ProductRow, 'id'>) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();
  return { data: data as ProductRow | null, error };
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  return { error };
}

export async function getOrCreateWallet(ownerId: string, defaultPhone: string = '677000000', defaultCarrier: 'MTN' | 'Orange' = 'MTN') {
  // Try get wallet
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (wallet) {
    return { data: wallet as WalletRow, error: null };
  }

  // Create if missing
  const newWallet = {
    owner_id: ownerId,
    phone: defaultPhone,
    carrier: defaultCarrier,
    balance: 150000, // Starting play money (150,000 FCFA)
  };

  const { data: created, error: createError } = await supabase
    .from('wallets')
    .insert([newWallet])
    .select()
    .single();

  return { data: created as WalletRow | null, error: createError };
}

export async function processPurchase(buyerId: string, sellerId: string, productId: string, quantity: number, pricePerUnit: number) {
  const totalAmount = quantity * pricePerUnit;

  // 1. Get buyer wallet
  const { data: buyerWallet, error: bError } = await getOrCreateWallet(buyerId);
  if (bError || !buyerWallet) return { error: new Error("Impossible de trouver le portefeuille de l'acheteur") };

  if (buyerWallet.balance < totalAmount) {
    return { error: new Error("Solde insuffisant dans votre portefeuille Mobile Money") };
  }

  // 2. Get seller wallet
  const { data: sellerWallet, error: sError } = await getOrCreateWallet(sellerId);
  if (sError || !sellerWallet) return { error: new Error("Impossible de trouver le portefeuille du vendeur") };

  // 3. Create Order in Supabase
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ buyer_id: buyerId, total_amount: totalAmount, status: 'completed' }])
    .select()
    .single();

  if (orderError || !order) return { error: orderError };

  // 4. Create Order Item
  const { error: itemError } = await supabase
    .from('order_items')
    .insert([{ order_id: order.id, product_id: productId, quantity, price: pricePerUnit }]);

  if (itemError) return { error: itemError };

  // 5. Update buyer balance
  const { error: payError } = await supabase
    .from('wallets')
    .update({ balance: buyerWallet.balance - totalAmount })
    .eq('id', buyerWallet.id);

  if (payError) return { error: payError };

  // 6. Log payment transaction
  await supabase
    .from('wallet_transactions')
    .insert([{
      wallet_id: buyerWallet.id,
      type: 'payment',
      amount: totalAmount,
      description: `Achat produit ${productId}`,
      reference: `BUY-${order.id.slice(0, 8)}`,
      status: 'completed',
    }]);

  // 7. Update seller balance
  const { error: recvError } = await supabase
    .from('wallets')
    .update({ balance: sellerWallet.balance + totalAmount })
    .eq('id', sellerWallet.id);

  if (recvError) return { error: recvError };

  // 8. Log receive transaction
  await supabase
    .from('wallet_transactions')
    .insert([{
      wallet_id: sellerWallet.id,
      type: 'receive',
      amount: totalAmount,
      description: `Vente produit ${productId}`,
      reference: `SELL-${order.id.slice(0, 8)}`,
      status: 'completed',
    }]);

  return { data: order, error: null };
}
