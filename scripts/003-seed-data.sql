-- Seed data for development/testing
-- Only run this in development environments

-- Insert default tags
INSERT INTO tags (name, color) VALUES
  ('Quick & Easy', '#22c55e'),
  ('Vegetarian', '#16a34a'),
  ('Vegan', '#15803d'),
  ('Gluten-Free', '#eab308'),
  ('Dairy-Free', '#f97316'),
  ('Healthy', '#06b6d4'),
  ('Comfort Food', '#f59e0b'),
  ('Dessert', '#ec4899'),
  ('Breakfast', '#8b5cf6'),
  ('Lunch', '#3b82f6'),
  ('Dinner', '#6366f1'),
  ('Snack', '#14b8a6'),
  ('Holiday', '#ef4444'),
  ('Meal Prep', '#84cc16')
ON CONFLICT (name) DO NOTHING;
