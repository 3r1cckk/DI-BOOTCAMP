create table if not exists members (
  id text primary key,
  data text not null
);

create table if not exists loans (
  id text primary key,
  member_id text not null references members(id),
  data text not null
);

create table if not exists transactions (
  id text primary key,
  member_id text not null references members(id),
  mpesa_ref text unique,
  data text not null
);

create table if not exists users (
  id text primary key,
  email text not null collate nocase unique,
  password_hash text not null,
  password_salt text not null,
  created_at text not null default current_timestamp
);

create table if not exists sessions (
  token_hash text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at integer not null
);
