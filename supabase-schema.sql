-- Run this in your Supabase SQL editor

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

-- Drinks table
create table public.drinks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('matcha', 'bubble_tea', 'coffee', 'juice', 'other')),
  sugar_grams numeric not null check (sugar_grams >= 0),
  price numeric not null check (price >= 0),
  image_url text,
  shop_name text,            -- V2: AI-filled from chat
  sugar_percentage numeric,  -- V2: AI-calculated from "25% sugar"
  is_public boolean default false not null, -- V2: social profiles
  consumed_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Indexes for common queries
create index drinks_user_id_consumed_at on public.drinks (user_id, consumed_at desc);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.drinks enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

create policy "Users manage own drinks"
  on public.drinks for all
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for drink photos
insert into storage.buckets (id, name, public) values ('drink-photos', 'drink-photos', true);

create policy "Users upload own photos"
  on storage.objects for insert
  with check (bucket_id = 'drink-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'drink-photos');
