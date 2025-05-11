-- Function to create categories table
CREATE OR REPLACE FUNCTION create_categories_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create inventory_items table
CREATE OR REPLACE FUNCTION create_inventory_items_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    student_limit INTEGER,
    limit_duration INTEGER DEFAULT 7,
    limit_duration_minutes INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'item',
    is_weighed BOOLEAN DEFAULT FALSE,
    has_limit BOOLEAN DEFAULT TRUE,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create transactions table
CREATE OR REPLACE FUNCTION create_transactions_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    student_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create student_checkouts table
CREATE OR REPLACE FUNCTION create_student_checkouts_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS student_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    item_id TEXT REFERENCES inventory_items(id),
    checkout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantity INTEGER NOT NULL DEFAULT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create orders tables
CREATE OR REPLACE FUNCTION create_orders_tables()
RETURNS void AS $$
BEGIN
  -- Create orders table
  CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create order_items table
  CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to decrement inventory
CREATE OR REPLACE FUNCTION create_decrement_inventory_function()
RETURNS void AS $$
BEGIN
  CREATE OR REPLACE FUNCTION decrement_inventory(p_item_id TEXT, p_quantity INTEGER)
  RETURNS BOOLEAN AS $$
  DECLARE
    current_quantity INTEGER;
  BEGIN
    -- Get current quantity
    SELECT quantity INTO current_quantity FROM inventory_items WHERE id = p_item_id;
    
    -- Check if we have enough inventory
    IF current_quantity >= p_quantity THEN
      -- Update inventory
      UPDATE inventory_items 
      SET quantity = quantity - p_quantity,
          updated_at = NOW()
      WHERE id = p_item_id;
      
      -- Record transaction
      INSERT INTO transactions (
        item_id, 
        quantity, 
        transaction_type,
        notes
      ) VALUES (
        p_item_id,
        p_quantity,
        'checkout',
        'Inventory decremented via function'
      );
      
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END;
  $$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;
