-- Existing CREATE TABLE or ALTER TABLE statements for services...

-- Add category_id column if it doesn't exist (assuming it should reference categories)
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE;

-- Remove the subcategory_id column and its foreign key constraint
ALTER TABLE public.services
DROP CONSTRAINT IF EXISTS services_subcategory_id_fkey,
DROP COLUMN IF EXISTS subcategory_id;

-- Make category_id NOT NULL (assuming a service must belong to a category)
ALTER TABLE public.services
ALTER COLUMN category_id SET NOT NULL;

-- Optional: Add an index for performance
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id); 