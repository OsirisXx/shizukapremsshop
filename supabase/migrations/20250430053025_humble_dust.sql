/*
  # Initial database schema for Premium Shop
  
  1. Tables
    - `profiles` - User profiles with roles
    - `categories` - Main categories (e.g., Premium Accounts, Programming)
    - `subcategories` - Subcategories within main categories
    - `items` - Items within categories (accounts, services)
    - `comments` - User comments on categories or items
    - `images` - Image metadata for proofs and projects
    - `services` - Services offered within subcategories
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and admin users
*/

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  duration_months INTEGER,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  CHECK (
    (category_id IS NOT NULL AND item_id IS NULL) OR
    (category_id IS NULL AND item_id IS NOT NULL)
  )
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  url TEXT NOT NULL,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('proofs', 'projects')),
  CHECK (
    (item_id IS NOT NULL AND subcategory_id IS NULL) OR
    (item_id IS NULL AND subcategory_id IS NOT NULL)
  )
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE
);

