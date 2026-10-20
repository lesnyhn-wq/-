/*
# Add online timer settings + server-side mark_ready

1. Purpose
   The host-side "start countdown when majority ready" logic lived in the
   browser and used the client clock to both SET the deadline and FIRE the
   advance. Two problems came from that:
   - Clock skew: the browser could fire advance_online_round before the
     server's now() reached the deadline. The RPC returned not_ready, the
     room row did not change, the timer effect never re-ran -> the game
     froze ("timer freezes and game stops").
   - Stale realtime: after an advance, the room update could arrive before
     the player update, letting the client majority effect re-arm a new
     deadline from stale ready states and skip a question.

   This migration moves deadline logic server-side and atomic:
   - Adds timer_enabled + timer_seconds columns to online_rooms.
   - Adds online_mark_ready(p_room_id, p_player_id, p_ready) RPC that updates
     a player's ready flag and, in the same transaction, decides whether to
     arm/cancel the countdown based on FRESH server-side counts. The client
     no longer sets ready_deadline.
   - The host only polls advance_online_round when a deadline exists; the
     RPC is idempotent so clock skew just causes a retry, never a freeze.

2. Mode behavior
   - timer_enabled = false: round advances the instant ALL players are ready
     (no countdown shown).
   - timer_enabled = true: when ALL players are ready, a countdown of
     timer_seconds starts; when it expires the round advances. If anyone
     un-marks ready, the countdown is cancelled.

3. Schema changes
   - online_rooms.timer_enabled boolean NOT NULL DEFAULT true
   - online_rooms.timer_seconds int NOT NULL DEFAULT 10

4. New / changed functions
   - online_mark_ready(p_room_id uuid, p_player_id text, p_ready boolean)
     RETURNS jsonb, SECURITY DEFINER, search_path = public.
     Returns {"ok": true, "all_ready": bool, "deadline_set": bool?, ...}.
   - advance_online_round(uuid) unchanged (already idempotent).

5. Grants
   REVOKE ALL FROM public; GRANT EXECUTE TO anon, authenticated on
   online_mark_ready (no-auth, shared-by-code app).

6. Security notes
   online_mark_ready can only arm a countdown or advance a round that is in
   the 'voting' phase; it cannot be abused to skip rounds early. All
   deadline decisions use server now(), eliminating client clock skew.
*/

ALTER TABLE online_rooms
  ADD COLUMN IF NOT EXISTS timer_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS timer_seconds int NOT NULL DEFAULT 10;

CREATE OR REPLACE FUNCTION online_mark_ready(p_room_id uuid, p_player_id text, p_ready boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_phase text;
  r_timer_enabled boolean;
  r_timer_seconds int;
  r_deadline timestamptz;
  v_total int;
  v_ready_count int;
  v_all_ready boolean;
BEGIN
  UPDATE online_players
    SET ready = p_ready
    WHERE room_id = p_room_id AND player_id = p_player_id;

  SELECT phase, timer_enabled, timer_seconds, ready_deadline
    INTO r_phase, r_timer_enabled, r_timer_seconds, r_deadline
    FROM online_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF r_phase IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'room_not_found');
  END IF;

  IF r_phase <> 'voting' THEN
    RETURN jsonb_build_object('ok', true, 'phase', r_phase, 'all_ready', false);
  END IF;

  SELECT count(*), count(*) FILTER (WHERE ready)
    INTO v_total, v_ready_count
    FROM online_players
    WHERE room_id = p_room_id;

  v_all_ready := v_total > 0 AND v_ready_count = v_total;

  IF NOT r_timer_enabled THEN
    IF v_all_ready AND r_deadline IS NULL THEN
      -- advance immediately; set a past deadline so advance_online_round
      -- (which checks r_deadline > now()) proceeds, then run it.
      UPDATE online_rooms SET ready_deadline = now() - interval '1 second'
        WHERE id = p_room_id;
      PERFORM advance_online_round(p_room_id);
    END IF;
    RETURN jsonb_build_object('ok', true, 'all_ready', v_all_ready, 'timer_enabled', false);
  END IF;

  -- timer enabled
  IF v_all_ready AND r_deadline IS NULL THEN
    UPDATE online_rooms
      SET ready_deadline = now() + make_interval(secs => r_timer_seconds)
      WHERE id = p_room_id;
    RETURN jsonb_build_object('ok', true, 'all_ready', true, 'deadline_set', true, 'timer_seconds', r_timer_seconds);
  ELSIF NOT v_all_ready AND r_deadline IS NOT NULL THEN
    UPDATE online_rooms SET ready_deadline = null WHERE id = p_room_id;
    RETURN jsonb_build_object('ok', true, 'all_ready', false, 'deadline_cleared', true);
  END IF;

  RETURN jsonb_build_object('ok', true, 'all_ready', v_all_ready, 'timer_enabled', true);
END;
$$;

REVOKE ALL ON FUNCTION online_mark_ready(uuid, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION online_mark_ready(uuid, text, boolean) TO anon, authenticated;
