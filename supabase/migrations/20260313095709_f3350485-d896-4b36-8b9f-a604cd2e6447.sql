
-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add slug column to hospitals
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS slug text UNIQUE;
