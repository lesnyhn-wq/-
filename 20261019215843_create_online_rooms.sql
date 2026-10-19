/*
# Online game rooms — shared multiplayer "Норм или Стрем?"

1. Purpose
   One player hosts a room, others join via a 6-character code.
   The host picks how many questions the room will play.
   Everyone sees the same question at the same time. Each player votes
   "norm" or "strem". When the majority of players have marked themselves
   "ready", the next question advances after a short countdown.
   At the end, a results screen shows the aggregate votes for every
   question, plus a per-question breakdown of who voted what.

2. Tables
   - `online_rooms`: a game room. Has a short code, host identity, total
     question count, current question index, phase (lobby/voting/results/finished),
     and a "ready" deadline timestamp used for the 5-second countdown.
   - `online_players`: one row per player in a room. Tracks name, ready
     state, and vote for the current question.
   - `online_question_state`: one row per question slot in a room. Stores
     the question text chosen for that slot and whether the room has
     advanced past it. Lets late joiners see the current question.

3. Security
   - No sign-in screen in this app — every client talks to Supabase as
     the anon role. All policies are `TO anon, authenticated` with
     `USING (true)` / `WITH CHECK (true)` because the room data is
     intentionally shared between anonymous players who know the room code.
   - RLS is enabled on every table so we can use Realtime subscriptions
     safely; the open policies grant the anon client full CRUD, which is
     the correct posture for a no-auth multiplayer party game.

4. Notes
   - `online_rooms.code` has a unique index so room codes can't collide.
   - `phase` is one of: 'lobby', 'voting', 'results', 'finished'.
   - The frontend orchestrates phase transitions and question advancement
     based on the ready/vote state it reads from these tables; no stored
     procedures are required for the core flow.
*/

CREATE TABLE IF NOT EXISTS online_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  host_id text NOT NULL,
  host_name text NOT NULL,
  question_count int NOT NULL DEFAULT 10,
  current_index int NOT NULL DEFAULT 0,
  phase text NOT NULL DEFAULT 'lobby',
  ready_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS online_rooms_code_unique ON online_rooms (code);

ALTER TABLE online_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rooms" ON online_rooms;
CREATE POLICY "anon_select_rooms" ON online_rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON online_rooms;
CREATE POLICY "anon_insert_rooms" ON online_rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON online_rooms;
CREATE POLICY "anon_update_rooms" ON online_rooms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON online_rooms;
CREATE POLICY "anon_delete_rooms" ON online_rooms FOR DELETE
  TO anon, authenticated USING (true);

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

ALTER TABLE online_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON online_players;
CREATE POLICY "anon_select_players" ON online_players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON online_players;
CREATE POLICY "anon_insert_players" ON online_players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON online_players;
CREATE POLICY "anon_update_players" ON online_players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON online_players;
CREATE POLICY "anon_delete_players" ON online_players FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS online_question_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES online_rooms(id) ON DELETE CASCADE,
  slot_index int NOT NULL,
  question_text text NOT NULL,
  UNIQUE (room_id, slot_index)
);

ALTER TABLE online_question_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_qstate" ON online_question_state;
CREATE POLICY "anon_select_qstate" ON online_question_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_qstate" ON online_question_state;
CREATE POLICY "anon_insert_qstate" ON online_question_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_qstate" ON online_question_state;
CREATE POLICY "anon_update_qstate" ON online_question_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_qstate" ON online_question_state;
CREATE POLICY "anon_delete_qstate" ON online_question_state FOR DELETE
  TO anon, authenticated USING (true);
