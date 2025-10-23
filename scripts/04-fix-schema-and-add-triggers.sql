-- Drop and recreate tables with correct structure and add triggers for friend codes

-- Drop existing tables to recreate with proper structure
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with friend codes
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  user_code TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friend requests table
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_code TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID,
  content TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'voice')) DEFAULT 'text',
  file_url TEXT,
  is_ai BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'closed', 'rejected')) DEFAULT 'open',
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support messages table
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text',
  file_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate unique 5-digit friend code
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 5-digit code
    new_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE user_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate admin code (0001, 0002, etc.)
CREATE OR REPLACE FUNCTION generate_admin_code()
RETURNS TEXT AS $$
DECLARE
  max_admin_code INTEGER;
  new_code TEXT;
BEGIN
  -- Get the highest admin code number
  SELECT COALESCE(MAX(user_code::INTEGER), 0) INTO max_admin_code
  FROM users
  WHERE is_admin = TRUE AND user_code ~ '^000[0-9]$';
  
  -- Generate next admin code
  new_code := LPAD((max_admin_code + 1)::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate friend code on user insert
CREATE OR REPLACE FUNCTION set_user_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin THEN
    NEW.user_code := generate_admin_code();
  ELSE
    NEW.user_code := generate_friend_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_user_code
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.user_code IS NULL OR NEW.user_code = '')
EXECUTE FUNCTION set_user_code();

-- Create indexes for better performance
CREATE INDEX idx_users_code ON users(user_code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_code ON friend_requests(receiver_code);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their friend requests" ON friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update received requests" ON friend_requests FOR UPDATE
  USING (receiver_id = auth.uid());

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships" ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can delete their friendships" ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM group_members WHERE group_id = messages.group_id AND user_id = auth.uid()));
CREATE POLICY "Users can send messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- RLS Policies for groups
CREATE POLICY "Users can view their groups" ON groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON groups FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- RLS Policies for group_members
CREATE POLICY "Users can view group members" ON group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Group creators can add members" ON group_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (true);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their tickets" ON support_tickets FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update tickets" ON support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for support_messages
CREATE POLICY "Users can view ticket messages" ON support_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND 
         (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))));
CREATE POLICY "Users can send ticket messages" ON support_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());
