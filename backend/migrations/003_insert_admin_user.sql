INSERT INTO users (username, password, role)
VALUES 
  ('vlad', 'popasulpescarilor2007', 'admin'),
  ('binod', '123456', 'staff'),
  ('sagar', '123456', 'staff'),
  ('robert', '123456', 'staff'),
  ('sabina', '123456', 'staff')
ON CONFLICT (username) DO NOTHING;
