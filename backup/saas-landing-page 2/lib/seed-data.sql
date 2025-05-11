-- Insert default categories if they don't exist
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

-- Insert sample inventory items
INSERT INTO inventory_items (
  id, name, category_id, quantity, student_limit, limit_duration, 
  limit_duration_minutes, unit, is_weighed, has_limit, cost
)
VALUES
  ('1', 'Rice', 'grains', 50, 1, 7, 0, 'kg', true, true, 2.50),
  ('2', 'Beans', 'essentials', 30, 2, 7, 0, 'item', false, true, 1.25),
  ('3', 'Pasta', 'grains', 40, 2, 7, 0, 'item', false, true, 1.75),
  ('4', 'Canned Soup', 'canned', 25, 3, 7, 0, 'item', false, true, 1.50),
  ('5', 'Cereal', 'essentials', 20, 1, 7, 0, 'item', false, true, 3.25),
  ('6', 'Milk', 'dairy', 15, 1, 3, 0, 'item', false, true, 2.75),
  ('7', 'Bread', 'essentials', 25, 1, 3, 0, 'item', false, true, 2.00),
  ('8', 'Eggs', 'dairy', 20, 1, 7, 0, 'item', false, true, 3.50),
  ('9', 'Potatoes', 'produce', 30, 2, 7, 0, 'kg', true, true, 1.20),
  ('10', 'Onions', 'produce', 25, 1, 7, 0, 'kg', true, true, 1.00)
ON CONFLICT (id) DO NOTHING;
