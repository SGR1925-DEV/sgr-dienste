-- =============================================================================
-- Austragen: E-Mail-Vergleich case-insensitive
-- =============================================================================
-- Die Funktion request_cancellation vergleicht die E-Mail jetzt ohne
-- Groß-/Kleinschreibung (lower/trim), damit „E-Mail passt nicht zur Buchung“
-- nicht mehr bei gleicher Adresse mit anderer Schreibweise erscheint.
--
-- Im Supabase Dashboard: SQL Editor → Neues Query → dieses Skript einfügen → Run
-- =============================================================================

-- Alle Varianten entfernen (bigint und integer für p_slot_id)
DROP FUNCTION IF EXISTS public.request_cancellation(bigint, text, boolean);
DROP FUNCTION IF EXISTS public.request_cancellation(integer, text, boolean);

CREATE OR REPLACE FUNCTION public.request_cancellation(
  p_slot_id bigint,
  p_email text,
  p_clear_contact boolean DEFAULT false
)
RETURNS TABLE(success boolean, slot_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact text;
BEGIN
  SELECT s.user_contact INTO v_contact
  FROM slots s
  WHERE s.id = p_slot_id;

  -- E-Mail case-insensitive vergleichen (wie beim Eintragen: lower + trim)
  IF v_contact IS NULL OR lower(trim(v_contact)) <> lower(trim(p_email)) THEN
    success := false;
    slot_id := p_slot_id;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE slots
  SET cancellation_requested = true
  WHERE id = p_slot_id;

  success := true;
  slot_id := p_slot_id;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_cancellation(bigint, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_cancellation(bigint, text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.request_cancellation(bigint, text, boolean) TO service_role;
