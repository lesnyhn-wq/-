/*
# Create online game tables (rooms, players, questions, votes)

1. Purpose
   Supports the "Norm or Strem" online multiplayer mode. A host creates a
   room with a 6-character code; other players join using that code. The
   game proceeds through a fixed number of questions; players vote
   "norm" or "strem" per question; the host advances rounds. This is a
   no-auth app: anyone with the room code can read/write that room's data.

2. New Tables
   - online_rooms
       id              uuid primary key (default gen_random_uuid)
       code            text unique not null (6-char room code)
       host_id         text not null (anonymous host player id, e.g. p_xxx)
       host_name       text not null
       question_count  int  not null default 10
       current_index   int  not null default 0
       phase           text not null default 'lobby'  -- lobby|voting|results|finished
       ready_deadline  timestamptz null (countdown end when majority ready)
       created_at      timestamptz default now()
   - online_players
       id          uuid primary key
       room_id     uuid not null references online_rooms(id) on delete cascade
       player_id   text not null (anonymous id, e.g. p_xxx)
       name        text not null
       vote        text null  -- null|norm|strem (current vote)
       ready       boolean not null default false
       joined_at   timestamptz default now()
       unique (room_id, player_id)
   - online_question_state
       id            uuid primary key
       room_id       uuid not null references online_rooms(id) on delete cascade
       slot_index    int  not null
       question_text text not null
       unique (room_id, slot_index)
   - online_votes
       id           uuid primary key
       room_id      uuid not null references online_rooms(id) on delete cascade
       slot_index   int  not null
       player_id    text not null
       player_name  text not null
       vote         text not null  -- norm|strem
       unique (room_id, slot_index, player_id)

3. Indexes
   - online_rooms.code (unique index for fast join lookup)
   - online_players.room_id
   - online_question_state.room_id
   - online_votes.room_id, slot_index

4. Security (RLS)
   This is a no-auth, shared-by-code app. Every policy is TO anon,
   authenticated with USING (true) / WITH CHECK (true) because room
   access is intentionally governed by knowing the room code (client
   side). This is the documented single-tenant/shared-data pattern.

5. Realtime
   Add all four tables to the supabase_realtime publication so the
   frontend receives live updates via Supabase channels.
*/

CREATE TABLE IF NOT EXISTS online_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  host_id text NOT NULL,
  host_name text NOT NULL,
  question_count int NOT NULL DEFAULT 10,
  current_index int NOT NULL DEFAULT 0,
  phase text NOT NULL DEFAULT 'lobby',
  ready_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS online_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES online_rooms(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  name text NOT NULL,
  vote text,
  ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, player_id)
);

CREATE TABLE IF NOT EXISTS online_question_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES online_rooms(id) ON DELETE CASCADE,
  slot_index int NOT NULL,
  question_text text NOT NULL,
  UNIQUE (room_id, slot_index)
);

CREATE TABLE IF NOT EXISTS online_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES online_rooms(id) ON DELETE CASCADE,
  slot_index int NOT NULL,
  player_id text NOT NULL,
  player_name text NOT NULL,
  vote text NOT NULL,
  UNIQUE (room_id, slot_index, player_id)
);

-- Enable RLS on all tables
ALTER TABLE online_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_question_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_votes ENABLE ROW LEVEL SECURITY;

-- online_rooms policies (shared by code; no auth)
DROP POLICY IF EXISTS "anon_select_online_rooms" ON online_rooms;
CREATE POLICY "anon_select_online_rooms" ON online_rooms
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_online_rooms" ON online_rooms;
CREATE POLICY "anon_insert_online_rooms" ON online_rooms
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_online_rooms" ON online_rooms;
CREATE POLICY "anon_update_online_rooms" ON online_rooms
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_online_rooms" ON online_rooms;
CREATE POLICY "anon_delete_online_rooms" ON online_rooms
  FOR DELETE TO anon, authenticated USING (true);

-- online_players policies
DROP POLICY IF EXISTS "anon_select_online_players" ON online_players;
CREATE POLICY "anon_select_online_players" ON online_players
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_online_players" ON online_players;
CREATE POLICY "anon_insert_online_players" ON online_players
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_online_players" ON online_players;
CREATE POLICY "anon_update_online_players" ON online_players
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_online_players" ON online_players;
CREATE POLICY "anon_delete_online_players" ON online_players
  FOR DELETE TO anon, authenticated USING (true);

-- online_question_state policies
DROP POLICY IF EXISTS "anon_select_online_question_state" ON online_question_state;
CREATE POLICY "anon_select_online_question_state" ON online_question_state
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_online_question_state" ON online_question_state;
CREATE POLICY "anon_insert_online_question_state" ON online_question_state
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_online_question_state" ON online_question_state;
CREATE POLICY "anon_update_online_question_state" ON online_question_state
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_online_question_state" ON online_question_state;
CREATE POLICY "anon_delete_online_question_state" ON online_question_state
  FOR DELETE TO anon, authenticated USING (true);

-- online_votes policies
DROP POLICY IF EXISTS "anon_select_online_votes" ON online_votes;
CREATE POLICY "anon_select_online_votes" ON online_votes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_online_votes" ON online_votes;
CREATE POLICY "anon_insert_online_votes" ON online_votes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_online_votes" ON online_votes;
CREATE POLICY "anon_update_online_votes" ON online_votes
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_online_votes" ON online_votes;
CREATE POLICY "anon_delete_online_votes" ON online_votes
  FOR DELETE TO anon, authenticated USING (true);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE online_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE online_players;
ALTER PUBLICATION supabase_realtime ADD TABLE online_question_state;
ALTER PUBLICATION supabase_realtime ADD TABLE online_votes;
