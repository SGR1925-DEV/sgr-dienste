-- Backfill match_date + kickoff_at from legacy text fields.
-- Assumes matches.date formatted like "So, 06.12." and matches.time like "14:30".
-- Heuristik: Datum ohne Jahr wird +/- 9 Monate um aktuelles Jahr korrigiert.

WITH parsed AS (
  SELECT
    id,
    (regexp_match(date, '(\d{1,2})\.(\d{1,2})')) AS parts
  FROM public.matches
  WHERE match_date IS NULL
    AND date IS NOT NULL
),
normalized AS (
  SELECT
    id,
    (parts[1])::int AS day,
    (parts[2])::int AS month,
    EXTRACT(YEAR FROM CURRENT_DATE)::int AS base_year
  FROM parsed
  WHERE parts IS NOT NULL
),
resolved AS (
  SELECT
    id,
    CASE
      WHEN (make_date(base_year, month, day) - CURRENT_DATE) > INTERVAL '270 days'
        THEN make_date(base_year - 1, month, day)
      WHEN (make_date(base_year, month, day) - CURRENT_DATE) < INTERVAL '-270 days'
        THEN make_date(base_year + 1, month, day)
      ELSE make_date(base_year, month, day)
    END AS resolved_date
  FROM normalized
)
UPDATE public.matches m
SET match_date = resolved.resolved_date
FROM resolved
WHERE m.id = resolved.id;

-- Backfill kickoff_at (falls match_date vorhanden und kickoff_at leer).
WITH time_parts AS (
  SELECT
    id,
    match_date,
    (regexp_match(time, '(\d{1,2}):(\d{2})')) AS parts
  FROM public.matches
  WHERE kickoff_at IS NULL
    AND match_date IS NOT NULL
    AND time IS NOT NULL
),
resolved AS (
  SELECT
    id,
    match_date,
    (parts[1])::int AS hh,
    (parts[2])::int AS mm
  FROM time_parts
  WHERE parts IS NOT NULL
)
UPDATE public.matches m
SET kickoff_at = (m.match_date::timestamp
  + make_interval(hours => resolved.hh, mins => resolved.mm))
FROM resolved
WHERE m.id = resolved.id;
