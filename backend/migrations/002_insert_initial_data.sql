-- INSERT UMBRELLAS
DO $$
BEGIN
  FOR i IN 1..150 LOOP
    INSERT INTO umbrellas (umbrella_number)
    VALUES (i)
    ON CONFLICT (umbrella_number) DO NOTHING;
  END LOOP;
END $$;

-- INSERT BEDS IF NOT ALREADY PRESENT
INSERT INTO beds (umbrella_id, side, status)
SELECT u.id, 'left', 'free'
FROM umbrellas u
WHERE NOT EXISTS (
  SELECT 1 FROM beds b WHERE b.umbrella_id = u.id AND b.side = 'left'
);

INSERT INTO beds (umbrella_id, side, status)
SELECT u.id, 'right', 'free'
FROM umbrellas u
WHERE NOT EXISTS (
  SELECT 1 FROM beds b WHERE b.umbrella_id = u.id AND b.side = 'right'
);
