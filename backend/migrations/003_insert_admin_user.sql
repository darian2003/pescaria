INSERT INTO users (username, password, role)
VALUES 
  ('admin', 'admin', 'admin'),
  ('razvan', 'razvan', 'staff'),
  ('darian', 'darian', 'staff'),
  ('steli', 'steli', 'staff'),
  ('andrei', 'andrei', 'staff')
ON CONFLICT (username) DO NOTHING;
