/*
# Online vote history — per-question vote breakdown

1. Purpose
   Records each player's vote for each question slot in an online room,
   so the results screen can show who voted "norm" or "strem" on every
   question, not just the last one.

2. Tables
   - `online_votes`: one row per (room, slot, player). Captured by the
     host when the room advances past a question. Stores the player's
     name snapshot and their vote at that moment.

3. Security
   - No sign-in: policies are `TO anon, authenticated` with open CRUD,
     matching the other online_* tables — room data is intentionally
     shared between anonymous players who know the room code.
*/

CREATE TABLE IF NOT EXISTS online_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES online_rooms(id) ON DELETE CASCADE,
  slot_index int NOT NULL,
  player_id text NOT NULL,
  player_name text NOT NULL,
  vote text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, slot_index, player_id)
);

ALTER TABLE online_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_votes" ON online_votes;
CREATE POLICY "anon_select_votes" ON online_votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON online_votes;
CREATE POLICY "anon_insert_votes" ON online_votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_votes" ON online_votes;
CREATE POLICY "anon_update_votes" ON online_votes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_votes" ON online_votes;
CREATE POLICY "anon_delete_votes" ON online_votes FOR DELETE
  TO anon, authenticated USING (true);
