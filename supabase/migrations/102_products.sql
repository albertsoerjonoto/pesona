CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL CHECK (category IN ('cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'exfoliator', 'mask', 'eye_cream', 'lip_care', 'spot_treatment', 'body_lotion', 'other')),
  suitable_skin_types text[] DEFAULT '{}',
  addresses_concerns text[] DEFAULT '{}',
  key_ingredients text[] DEFAULT '{}',
  price_idr integer,
  shopee_url text,
  tiktok_shop_url text,
  tokopedia_url text,
  image_url text,
  bpom_registered boolean DEFAULT false,
  halal_certified boolean DEFAULT false,
  description text,
  how_to_use text,
  rating_avg numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
