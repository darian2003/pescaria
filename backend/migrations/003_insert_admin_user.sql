INSERT INTO users (username, password, role)
VALUES 
  ('Vlad', 'popasulpescarilor2007', 'admin'),
  ('Binod', '123456', 'staff'),
  ('Sagar', '123456', 'staff'),
  ('Robert', '123456', 'staff'),
  ('Sabina', '123456', 'staff')
ON CONFLICT (username) DO NOTHING;
