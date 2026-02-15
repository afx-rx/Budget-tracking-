-- 1. PROFILES TABLE
-- Stores user settings like budget, currency, and name.
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  currency text default '$',
  monthly_budget numeric default 2000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);


-- 2. TRANSACTIONS TABLE
-- Stores all income, expense, and pending transactions.
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  amount numeric not null,
  type text not null, -- 'INCOME' or 'EXPENSE'
  status text not null, -- 'COMPLETED' or 'PENDING'
  category text not null,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security
alter table public.transactions enable row level security;

-- Policies for Transactions
create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own transactions" on public.transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own transactions" on public.transactions
  for delete using (auth.uid() = user_id);


-- 3. AUTOMATION
-- Automatically create a profile entry when a new user signs up via Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();