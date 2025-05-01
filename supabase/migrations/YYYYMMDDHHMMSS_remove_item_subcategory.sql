-- Existing CREATE TABLE or ALTER TABLE statements for items...

-- Ensure category_id exists and references categories
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE;

-- Remove the subcategory_id column
ALTER TABLE public.items
DROP COLUMN IF EXISTS subcategory_id;

-- Make category_id NOT NULL (assuming an item must belong to a category)
ALTER TABLE public.items
ALTER COLUMN category_id SET NOT NULL;

-- Optional: Add an index for performance
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id); 