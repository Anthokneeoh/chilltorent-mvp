-- ============================================
-- ChillToRent MVP - Ultimate Schema (May 2026)
-- Target Region: Nigeria (Lagos, Abuja, PH)
-- ============================================

-- 1. PROFILES table 
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('tenant', 'landlord', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROPERTIES table 
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT CHECK (property_type IN ('flat', 'bungalow', 'duplex', 'room', 'self_contain', 'studio')),
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  annual_rent BIGINT NOT NULL,
  caution_fee BIGINT DEFAULT 0,
  agency_fee BIGINT DEFAULT 0,
  agreement_fee BIGINT DEFAULT 0,
  legal_fee BIGINT DEFAULT 0,
  total_package BIGINT GENERATED ALWAYS AS (annual_rent + caution_fee + agency_fee + agreement_fee + legal_fee) STORED,
  address TEXT NOT NULL,
  lga TEXT NOT NULL,
  state TEXT DEFAULT 'Lagos',
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  electricity_band TEXT CHECK (electricity_band IN ('A', 'B', 'C', 'D', 'E')),
  water_source TEXT CHECK (water_source IN ('borehole', 'mains', 'well')),
  security_rating TEXT CHECK (security_rating IN ('estate_security', 'street_gate', 'none')),
  road_condition TEXT CHECK (road_condition IN ('tarred', 'interlocked', 'untarred')),
  is_furnished BOOLEAN DEFAULT FALSE,
  ownership_doc_url TEXT, 
  status TEXT DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'RENTED', 'OFFLINE')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROPERTY MEDIA
CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  is_thumbnail BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0, 
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VIEWING REQUESTS 
CREATE TABLE viewing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id),
  landlord_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
  proposed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MESSAGES 
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewing_request_id UUID REFERENCES viewing_requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. AGREEMENTS 
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewing_request_id UUID REFERENCES viewing_requests(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  landlord_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES profiles(id),
  pdf_url TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'GENERATED', 'DOWNLOADED_LANDLORD', 'DOWNLOADED_TENANT')),
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. LISTING PAYMENTS 
CREATE TABLE listing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES profiles(id),
  amount_paid BIGINT,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'ussd')),
  payment_proof_url TEXT,
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_payments ENABLE ROW LEVEL SECURITY;

-- Profiles Security
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties Security
CREATE POLICY "Active properties are viewable by everyone" ON properties FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Landlords can view all their own properties" ON properties FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can insert properties" ON properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own properties" ON properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Admins have full access to properties" ON properties FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Property Media Security
CREATE POLICY "Public can view media of active properties" ON property_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND status = 'ACTIVE')
);
CREATE POLICY "Landlords can manage media of own properties" ON property_media FOR ALL USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND landlord_id = auth.uid())
);

-- Viewing Requests Security
CREATE POLICY "Users can view their associated requests" ON viewing_requests FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenants can initiate requests" ON viewing_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Involved parties can update request variables" ON viewing_requests FOR UPDATE USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Chat Messages Security 
CREATE POLICY "Users can view conversation message history" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM viewing_requests vr WHERE vr.id = viewing_request_id AND (vr.tenant_id = auth.uid() OR vr.landlord_id = auth.uid()))
);
CREATE POLICY "Users can append messages to active threads" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM viewing_requests vr WHERE vr.id = viewing_request_id AND (vr.tenant_id = auth.uid() OR vr.landlord_id = auth.uid()))
);
CREATE POLICY "Thread participants can modify message parameters like read states" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM viewing_requests vr WHERE vr.id = viewing_request_id AND (vr.tenant_id = auth.uid() OR vr.landlord_id = auth.uid()))
);

-- Agreements Security
CREATE POLICY "Participants can select agreements" ON agreements FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Payments Security
CREATE POLICY "Landlords can monitor own transactions" ON listing_payments FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can submit transaction ledger instances" ON listing_payments FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Admins possess full administrative rights on transactions" ON listing_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- AUTOMATED AUTH PROFILE TRIGGER ENGINE 
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'tenant')
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- HIGH-SPEED STRUCTURAL INDEXES
-- ============================================
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_lga ON properties(lga);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_property_media_link ON property_media(property_id);
CREATE INDEX idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX idx_viewing_requests_tenant ON viewing_requests(tenant_id);
CREATE INDEX idx_viewing_requests_landlord ON viewing_requests(landlord_id);
CREATE INDEX idx_messages_viewing_request_id ON messages(viewing_request_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_agreements_lookup ON agreements(viewing_request_id);
CREATE INDEX idx_listing_payments_property ON listing_payments(property_id);