-- Create a function to decrement inventory
CREATE OR REPLACE FUNCTION decrement_inventory(item_id_param TEXT, quantity_param DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE inventory_items
  SET quantity = quantity - quantity_param
  WHERE id = item_id_param;
END;
$$ LANGUAGE plpgsql;
