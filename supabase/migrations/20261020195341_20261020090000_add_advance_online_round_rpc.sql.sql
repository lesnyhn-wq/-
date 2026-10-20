/*
# Add atomic advance_online_round function (fixes round-skip race)

1. Purpose
   The host's client-side "advance round" logic raced with realtime updates:
   after the deadline passed and the host advanced (resetting players and
   clearing ready_deadline), the realtime player update arrived before the
   room update, re-triggering the advance effect with a stale room row whose
   ready_deadline was still set and in the past. The effect fired a second
   time and advanced the round again, skipping a question even when nobody
   was ready for the next one.

   This migration adds an atomic, idempotent server-side function
   advance_online_round(p_room_id) that the host calls when the deadline
   passes. It locks the room row, verifies the deadline has actually passed
   AND is still set, then in a single transaction: snapshots current votes
   into online_votes, resets all players' ready/vote, advances current_index
   (or moves to results), and clears ready_deadline. A second call is a
   no-op because ready_deadline is already null on the server.

2. New function
   - advance_online_round(p_room_id uuid) RETURNS jsonb
     SECURITY DEFINER, search_path = public
     Returns {"advanced": true, "phase": ..., "current_index": ...} on
     success, or {"advanced": false, "reason": "not_ready"} when the
     deadline hasn't passed or was already cleared (idempotent).

3. Grants
   REVOKE ALL FROM public; GRANT EXECUTE TO anon, authenticated so the
   no-auth frontend can call it.

4. Security notes
   The function is callable by anon/authenticated, but it can only advance
   a round whose ready_deadline is already set and in the past — it cannot
   be abused to skip rounds early. It is the only thing that clears
   ready_deadline, so concurrent/duplicate calls are safe.
*/

CREATE OR REPLACE FUNCTION advance_online_round(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_phase text;
  r_deadline timestamptz;
  r_current_index int;
  r_question_count int;
  r_total int;
  r_next_index int;
BEGIN
  SELECT phase, ready_deadline, current_index, question_count
    INTO r_phase, r_deadline, r_current_index, r_question_count
    FROM online_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF r_phase IS NULL THEN
    RETURN jsonb_build_object('advanced', false, 'reason', 'room_not_found');
  END IF;

  IF r_phase <> 'voting' OR r_deadline IS NULL OR r_deadline > now() THEN
    RETURN jsonb_build_object('advanced', false, 'reason', 'not_ready');
  END IF;

  DELETE FROM online_votes
    WHERE room_id = p_room_id AND slot_index = r_current_index;

  INSERT INTO online_votes (room_id, slot_index, player_id, player_name, vote)
    SELECT pl.room_id, r_current_index, pl.player_id, pl.name, pl.vote
      FROM online_players pl
      WHERE pl.room_id = p_room_id AND pl.vote IN ('norm', 'strem');

  UPDATE online_players
    SET ready = false, vote = null
    WHERE room_id = p_room_id;

  SELECT count(*) INTO r_total FROM online_question_state WHERE room_id = p_room_id;
  IF r_total = 0 THEN
    r_total := r_question_count;
  END IF;

  r_next_index := r_current_index + 1;

  IF r_next_index >= r_total THEN
    UPDATE online_rooms SET phase = 'results', ready_deadline = null WHERE id = p_room_id;
    RETURN jsonb_build_object('advanced', true, 'phase', 'results', 'current_index', r_current_index);
  ELSE
    UPDATE online_rooms SET current_index = r_next_index, ready_deadline = null WHERE id = p_room_id;
    RETURN jsonb_build_object('advanced', true, 'phase', 'voting', 'current_index', r_next_index);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION advance_online_round(uuid) FROM public;
GRANT EXECUTE ON FUNCTION advance_online_round(uuid) TO anon, authenticated;
