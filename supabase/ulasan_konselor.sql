-- Jalankan di Supabase SQL Editor sebelum fitur ulasan aktif.

create table if not exists public.ulasan_konselor (
  id              uuid primary key default gen_random_uuid(),
  id_booking      text not null unique,
  id_konselor     text not null,
  id_mahasiswa    text not null,
  email_mahasiswa text,
  nama_mahasiswa  text not null,
  rating          smallint not null check (rating >= 1 and rating <= 5),
  teks            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ulasan_konselor_konselor on public.ulasan_konselor (id_konselor);
create index if not exists idx_ulasan_konselor_mahasiswa on public.ulasan_konselor (id_mahasiswa);

alter table public.ulasan_konselor enable row level security;

-- Semua user login boleh membaca ulasan
create policy "ulasan_select_all"
  on public.ulasan_konselor for select
  to authenticated
  using (true);

-- Mahasiswa hanya bisa insert ulasan miliknya
create policy "ulasan_insert_own"
  on public.ulasan_konselor for insert
  to authenticated
  with check (true);
