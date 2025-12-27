-- Add custom_category column to innovations table for storing custom category names when category is "other"
ALTER TABLE public.innovations 
ADD COLUMN custom_category text;