ALTER TABLE delivery_events ADD COLUMN material_key TEXT;
CREATE UNIQUE INDEX deliveries_material_dedupe ON delivery_events(user_id,rule_id,material_key);
