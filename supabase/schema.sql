-- XF のデータベース定義（Supabase に適用済みの内容と同じ）

-- ユーザー名（表示名）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 1 and 30),
  created_at timestamptz not null default now()
);

-- つぶやき
create table public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 280),
  created_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_user_id_idx on public.posts (user_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- 誰でも閲覧可・本人だけ書き込み/削除
create policy "profiles are viewable by everyone" on public.profiles
  for select to anon, authenticated using (true);
create policy "users can update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "posts are viewable by everyone" on public.posts
  for select to anon, authenticated using (true);
create policy "users can insert own posts" on public.posts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users can delete own posts" on public.posts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 新規登録時にプロフィールを自動作成
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
