-- ==========================================
-- AGRI SMART DATABASE MIGRATION SCRIPT
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('farmer', 'agronomist', 'cooperative_manager', 'admin')) default 'farmer',
  city text,
  region text,
  climate_zone text,
  crops text[] default '{}',
  experience text,
  objectives text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profile RLS Policies
create policy "Public profiles are viewable by authenticated users" 
  on public.profiles for select 
  to authenticated 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  to authenticated 
  using (auth.uid() = id);

-- Function to handle auto profile creation on Auth Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, crops)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'farmer',
    '{}'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user profile auto creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 2. PLOTS TABLE
-- ==========================================
create table public.plots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  crop text not null,
  area numeric default 0,
  soil_type text,
  latitude numeric,
  longitude numeric,
  health_status text default 'ok' check (health_status in ('ok', 'warning', 'critical')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.plots enable row level security;

-- Plots RLS Policies
create policy "Users can view their own plots"
  on public.plots for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Users can insert their own plots"
  on public.plots for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update their own plots"
  on public.plots for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Users can delete their own plots"
  on public.plots for delete
  to authenticated
  using (auth.uid() = owner_id);


-- ==========================================
-- 3. DIAGNOSTICS TABLE
-- ==========================================
create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  image_url text,
  disease text not null,
  confidence numeric default 0,
  causes text[] default '{}',
  treatment text,
  preventive_actions text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.diagnostics enable row level security;

-- Diagnostics RLS Policies
create policy "Users can view their own diagnostics"
  on public.diagnostics for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Users can insert their own diagnostics"
  on public.diagnostics for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can delete their own diagnostics"
  on public.diagnostics for delete
  to authenticated
  using (auth.uid() = owner_id);


-- ==========================================
-- 4. CALENDAR_EVENTS TABLE
-- ==========================================
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  type text check (type in ('semis', 'arrosage', 'fertilisation', 'traitement', 'récolte')) not null,
  title text not null,
  description text,
  event_date date not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.calendar_events enable row level security;

-- Calendar Events RLS Policies
create policy "Users can manage their own calendar events"
  on public.calendar_events for all
  to authenticated
  using (auth.uid() = owner_id);


-- ==========================================
-- 5. HARVESTS TABLE
-- ==========================================
create table public.harvests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  crop text not null,
  quantity numeric not null, -- kg
  yield numeric, -- t/ha
  revenue numeric, -- FCFA
  harvest_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.harvests enable row level security;

-- Harvests RLS Policies
create policy "Users can manage their own harvests"
  on public.harvests for all
  to authenticated
  using (auth.uid() = owner_id);


-- ==========================================
-- 6. FINANCES TABLE
-- ==========================================
create table public.finances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  amount numeric not null, -- FCFA
  transaction_date date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.finances enable row level security;

-- Finances RLS Policies
create policy "Users can manage their own finances"
  on public.finances for all
  to authenticated
  using (auth.uid() = owner_id);


-- ==========================================
-- 7. MARKETPLACE (PRODUCTS, ORDERS, ORDER_ITEMS)
-- ==========================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  price numeric not null, -- FCFA
  unit text not null, -- kg, sac, régime, etc.
  quantity numeric not null,
  city text,
  region text,
  phone text,
  crop text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  to authenticated
  using (true);

create policy "Users can manage their own products"
  on public.products for all
  to authenticated
  using (auth.uid() = owner_id);


-- Orders Table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users on delete cascade not null,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  total_amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = buyer_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = buyer_id);


-- Order Items Table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  quantity numeric not null,
  price numeric not null
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o 
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "Users can insert order items for their orders"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o 
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );


-- ==========================================
-- 8. MOBILE MONEY SIMULATION (WALLETS, TRANSACTIONS)
-- ==========================================
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null unique,
  phone text not null,
  carrier text check (carrier in ('MTN', 'Orange')) not null,
  balance numeric default 50000 not null, -- Initialized with some play money
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallets enable row level security;

create policy "Users can view their own wallet"
  on public.wallets for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Users can manage their own wallet"
  on public.wallets for all
  to authenticated
  using (auth.uid() = owner_id);


create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets on delete cascade not null,
  type text check (type in ('deposit', 'withdrawal', 'payment', 'receive')) not null,
  amount numeric not null,
  description text,
  reference text,
  status text check (status in ('pending', 'completed', 'failed')) default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallet_transactions enable row level security;

create policy "Users can view their wallet transactions"
  on public.wallet_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id and w.owner_id = auth.uid()
    )
  );


-- ==========================================
-- 9. COOPERATIVES
-- ==========================================
create table public.cooperatives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  creator_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cooperatives enable row level security;

create policy "Cooperatives are viewable by authenticated users"
  on public.cooperatives for select
  to authenticated
  using (true);

create policy "Users can create cooperatives"
  on public.cooperatives for insert
  to authenticated
  with check (auth.uid() = creator_id);


-- Members
create table public.cooperative_members (
  id uuid primary key default gen_random_uuid(),
  cooperative_id uuid references public.cooperatives on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text check (role in ('member', 'manager')) default 'member',
  status text check (status in ('pending', 'approved')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (cooperative_id, user_id)
);

alter table public.cooperative_members enable row level security;

create policy "Members are viewable by cooperative members"
  on public.cooperative_members for select
  to authenticated
  using (true);

create policy "Users can join cooperatives"
  on public.cooperative_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Managers can update memberships"
  on public.cooperative_members for update
  to authenticated
  using (
    exists (
      select 1 from public.cooperative_members m
      where m.cooperative_id = cooperative_id and m.user_id = auth.uid() and m.role = 'manager'
    )
    or exists (
      select 1 from public.cooperatives c
      where c.id = cooperative_id and c.creator_id = auth.uid()
    )
  );


-- Posts
create table public.cooperative_posts (
  id uuid primary key default gen_random_uuid(),
  cooperative_id uuid references public.cooperatives on delete cascade not null,
  author_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cooperative_posts enable row level security;

create policy "Cooperative posts are viewable by members"
  on public.cooperative_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.cooperative_members m
      where m.cooperative_id = cooperative_id and m.user_id = auth.uid() and m.status = 'approved'
    )
  );

create policy "Approved members can post"
  on public.cooperative_posts for insert
  to authenticated
  with check (
    auth.uid() = author_id and
    exists (
      select 1 from public.cooperative_members m
      where m.cooperative_id = cooperative_id and m.user_id = auth.uid() and m.status = 'approved'
    )
  );


-- ==========================================
-- 10. REAL-TIME MESSAGING
-- ==========================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  name text, -- Optional name for group chats
  is_group boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.conversations enable row level security;

-- Participants
create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

create policy "Users can view their conversation memberships"
  on public.conversation_participants for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view participants of their conversations"
  on public.conversation_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = conversation_id and p.user_id = auth.uid()
    )
  );

create policy "Conversations are viewable if user is participant"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = id and p.user_id = auth.uid()
    )
  );


-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Messages are viewable by conversation participants"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = conversation_id and p.user_id = auth.uid()
    )
  );

create policy "Participants can insert messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = conversation_id and p.user_id = auth.uid()
    )
  );


-- ==========================================
-- 11. SENSOR_DATA (IoT ready)
-- ==========================================
create table public.sensor_data (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid references public.plots on delete cascade not null,
  moisture numeric not null,
  temperature numeric not null,
  ph numeric not null,
  nitrogen numeric not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sensor_data enable row level security;

create policy "Users can view sensor data of their plots"
  on public.sensor_data for select
  to authenticated
  using (
    exists (
      select 1 from public.plots p
      where p.id = plot_id and p.owner_id = auth.uid()
    )
  );

create policy "Users can insert sensor data of their plots"
  on public.sensor_data for insert
  to authenticated
  with check (
    exists (
      select 1 from public.plots p
      where p.id = plot_id and p.owner_id = auth.uid()
    )
  );

-- ==========================================
-- STORAGE BUCKETS SETUP (Profiles, Plots, Diagnostics)
-- NOTE: Storage buckets need configuration in Supabase dashboard or SQL if supported.
-- The following inserts configuration into storage.buckets table:
-- ==========================================
insert into storage.buckets (id, name, public) values ('profiles', 'profiles', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('plots', 'plots', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('diagnostics', 'diagnostics', true) on conflict (id) do nothing;

-- Storage RLS Policies
create policy "Public can view profiles" on storage.objects for select using (bucket_id = 'profiles');
create policy "Authenticated users can upload to profiles" on storage.objects for insert to authenticated with check (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public can view plots" on storage.objects for select using (bucket_id = 'plots');
create policy "Authenticated users can upload to plots" on storage.objects for insert to authenticated with check (bucket_id = 'plots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public can view diagnostics" on storage.objects for select using (bucket_id = 'diagnostics');
create policy "Authenticated users can upload to diagnostics" on storage.objects for insert to authenticated with check (bucket_id = 'diagnostics' and (storage.foldername(name))[1] = auth.uid()::text);
