-- Existing CREATE TABLE or ALTER TABLE statements for images...

-- Add category_id column if it doesn't exist (assuming images can belong to categories)
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE;

-- Remove the subcategory_id column and its foreign key constraint
ALTER TABLE public.images
DROP CONSTRAINT IF EXISTS images_subcategory_id_fkey,
DROP COLUMN IF EXISTS subcategory_id;

-- Update the CHECK constraint: an image belongs to an item OR a category, but not both
-- First, drop the old constraint if it exists
ALTER TABLE public.images
DROP CONSTRAINT IF EXISTS images_check;

-- Add the new constraint
ALTER TABLE public.images
ADD CONSTRAINT images_check CHECK (
  (item_id IS NOT NULL AND category_id IS NULL) OR
  (item_id IS NULL AND category_id IS NOT NULL)
);

-- Optional: Add an index for performance
CREATE INDEX IF NOT EXISTS idx_images_category_id ON public.images(category_id); 