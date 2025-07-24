-- INSERT UMBRELLAS
DO $$
BEGIN
  FOR i IN 1..170 LOOP
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

SELECT u.umbrella_number, b.side, b.status
FROM umbrellas u
JOIN beds b ON u.id = b.umbrella_id
WHERE u.umbrella_number IN (1,2,3,4,18,19,20,21,35,36,37,38,52,53,54,55,69,70,71,72,86,87,88,89,103,104,105,106,120,121,122,123,137,138,139,140,154,155,156,157,5,22,39,56,73);
