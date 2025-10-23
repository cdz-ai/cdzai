-- Insert admin users
INSERT INTO users (email, username, user_code, is_admin) VALUES
  ('chemsdine.kchid02@gmail.com', 'Admin Chems 1', '00001', TRUE),
  ('chemsdine.kachid@gmail.com', 'Admin Chems 2', '00002', TRUE),
  ('chemsdine.kachid5@gmail.com', 'Admin Chems 3', '00003', TRUE),
  ('chemskachid993@gmail.com', 'Admin Chems 4', '00004', TRUE)
ON CONFLICT (email) DO NOTHING;
