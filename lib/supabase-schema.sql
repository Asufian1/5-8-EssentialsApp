-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(id),
  quantity DECIMAL NOT NULL DEFAULT 0,
  student_limit DECIMAL NOT NULL DEFAULT 1,
  limit_duration INTEGER NOT NULL DEFAULT 7,
  limit_duration_minutes INTEGER NOT NULL DEFAULT 0,
  unit TEXT,
  is_weighed BOOLEAN NOT NULL DEFAULT FALSE,
  has_limit BOOLEAN NOT NULL DEFAULT TRUE,
  cost DECIMAL,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  item_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  unit TEXT,
  cost DECIMAL,
  total_cost DECIMAL
);

-- Create student_checkouts table
CREATE TABLE IF NOT EXISTS student_checkouts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  quantity DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  unit TEXT
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  error TEXT
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL REFERENCES orders(id),
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  item_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  category TEXT NOT NULL,
  unit TEXT
);

-- Insert default categories
INSERT INTO categories (id, name, description)
VALUES
  ('essentials', 'Essentials', 'Basic food items'),
  ('grains', 'Grains', 'Rice, pasta, and other grains'),
  ('canned', 'Canned Goods', 'Canned foods and preserved items'),
  ('produce', 'Produce', 'Fresh fruits and vegetables'),
  ('dairy', 'Dairy', 'Milk, cheese, and other dairy products'),
  ('south-asian', 'South Asian', 'South Asian food items'),
  ('other', 'Other', 'Miscellaneous items')
ON CONFLICT (id) DO NOTHING;
