-- Insert admin users with proper 4-digit codes

-- Insert admin users (they will get codes 0001, 0002, 0003, 0004 automatically)
INSERT INTO users (email, username, is_admin, user_code)
VALUES 
  ('chemsdine.kchid02@gmail.com', 'Admin 1', true, '0001'),
  ('chemsdine.kachid@gmail.com', 'Admin 2', true, '0002'),
  ('chemsdine.kachid5@gmail.com', 'Admin 3', true, '0003'),
  ('chemskachid993@gmail.com', 'Admin 4', true, '0004')
ON CONFLICT (email) DO NOTHING;
