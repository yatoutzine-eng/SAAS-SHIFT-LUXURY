/*
  # Initial Schema for Vehicle Rental SaaS

  1. New Tables
    - `fleet`
      - `id` (uuid, primary key)
      - `name` (text) - Vehicle name
      - `price` (numeric) - Price per day
      - `image_url` (text) - Image link
      - `store_code` (text) - Unique identifier for the shop
      - `created_at` (timestamp)
    - `bookings`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `store_code` (text)
      - `status` (text) - Default 'pending'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Public read access for fleet (to allow shop browsing)
    - Public insert access for bookings (to allow customers to book)
*/

CREATE TABLE IF NOT EXISTS fleet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  image_url text NOT NULL,
  store_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES fleet(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  store_code text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for fleet
CREATE POLICY "Allow public read access for fleet" ON fleet
  FOR SELECT USING (true);

-- Policies for bookings
CREATE POLICY "Allow public insert for bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Insert some seed data
INSERT INTO fleet (name, price, image_url, store_code) VALUES
('Tesla Model 3', 89, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800', 'demo-store'),
('Porsche 911', 250, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800', 'demo-store'),
('Range Rover Sport', 150, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800', 'demo-store'),
('BMW M4', 120, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800', 'demo-store');
