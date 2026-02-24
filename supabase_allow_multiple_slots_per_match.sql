-- =============================================================================
-- Mehrere Dienste pro Spiel mit derselben E-Mail erlauben
-- =============================================================================
-- Die Funktion book_slot wird so angepasst, dass nur geprüft wird, ob DIESER
-- Slot frei ist – nicht mehr, ob die E-Mail schon einen anderen Slot im selben
-- Spiel hat. Eine Person kann sich damit für mehrere Dienste im selben Spiel
-- eintragen (z. B. Kiosk + Einlass).
--
-- Im Supabase Dashboard: SQL Editor → Neues Query → dieses Skript einfügen → Run
-- =============================================================================

-- Beide alten Versionen entfernen (bigint und integer), damit nur eine übrig bleibt
DROP FUNCTION IF EXISTS public.book_slot(bigint, text, text);
DROP FUNCTION IF EXISTS public.book_slot(integer, text, text);

CREATE OR REPLACE FUNCTION public.book_slot(
  p_slot_id bigint,
  p_name text,
  p_email text
)
RETURNS TABLE(success boolean, slot_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nur prüfen, ob DIESER Slot noch frei ist (user_contact/user_name leer)
  IF EXISTS (
    SELECT 1 FROM slots
    WHERE id = p_slot_id
      AND (user_contact IS NOT NULL OR user_name IS NOT NULL)
  ) THEN
    success := false;
    slot_id := p_slot_id;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE slots
  SET
    user_name = trim(p_name),
    user_contact = lower(trim(p_email))
  WHERE id = p_slot_id;

  success := true;
  slot_id := p_slot_id;
  RETURN NEXT;
END;
$$;

-- Berechtigung für authentifizierte und anon Nutzer (wie zuvor)
GRANT EXECUTE ON FUNCTION public.book_slot(bigint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_slot(bigint, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.book_slot(bigint, text, text) TO service_role;
