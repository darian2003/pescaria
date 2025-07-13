-- INSERT UMBRELLAS
DO $$
BEGIN
  FOR i IN 1..160 LOOP
    INSERT INTO umbrellas (umbrella_number) VALUES (i);
  END LOOP;
END $$;

-- INSERT BEDS
INSERT INTO beds (umbrella_id, side, status)
SELECT id, 'left', 'free' FROM umbrellas;

INSERT INTO beds (umbrella_id, side, status)
SELECT id, 'right', 'free' FROM umbrellas;
