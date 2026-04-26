
-- 1. Roles enum + user_roles table (separate from profiles to prevent privilege escalation)
CREATE TYPE public.app_role AS ENUM ('admin', 'caregiver', 'elderly');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. Caregiver links (many-to-many between caregivers and elderly)
CREATE TYPE public.link_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elderly_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status link_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caregiver_id, elderly_id),
  CHECK (caregiver_id <> elderly_id)
);
ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;

-- Security definer to check accepted link (avoids recursion in dependent tables)
CREATE OR REPLACE FUNCTION public.is_linked_caregiver(_caregiver UUID, _elderly UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_links
    WHERE caregiver_id = _caregiver
      AND elderly_id = _elderly
      AND status = 'accepted'
  )
$$;

CREATE POLICY "Either party views link" ON public.caregiver_links
  FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id OR auth.uid() = elderly_id);
CREATE POLICY "Caregiver creates pending link" ON public.caregiver_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caregiver_id AND status = 'pending');
CREATE POLICY "Elderly updates link status" ON public.caregiver_links
  FOR UPDATE TO authenticated USING (auth.uid() = elderly_id);
CREATE POLICY "Either party deletes link" ON public.caregiver_links
  FOR DELETE TO authenticated
  USING (auth.uid() = caregiver_id OR auth.uid() = elderly_id);

-- 4. Medications
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  schedule_times TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_medications_user ON public.medications(user_id);

CREATE POLICY "Owner manages medications" ON public.medications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Linked caregivers view medications" ON public.medications
  FOR SELECT TO authenticated
  USING (public.is_linked_caregiver(auth.uid(), user_id));

-- 5. Medication logs
CREATE TYPE public.med_log_status AS ENUM ('taken', 'missed', 'skipped');

CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status med_log_status NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_med_logs_user_time ON public.medication_logs(user_id, taken_at DESC);

CREATE POLICY "Owner manages med logs" ON public.medication_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Linked caregivers view med logs" ON public.medication_logs
  FOR SELECT TO authenticated
  USING (public.is_linked_caregiver(auth.uid(), user_id));

-- 6. Check-ins
CREATE TYPE public.mood_type AS ENUM ('great', 'good', 'okay', 'low', 'bad');

CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood mood_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_checkins_user_time ON public.check_ins(user_id, created_at DESC);

CREATE POLICY "Owner manages check-ins" ON public.check_ins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Linked caregivers view check-ins" ON public.check_ins
  FOR SELECT TO authenticated
  USING (public.is_linked_caregiver(auth.uid(), user_id));

-- 7. Alerts
CREATE TYPE public.alert_type AS ENUM ('missed_medication', 'emergency', 'low_mood', 'no_checkin');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_user_time ON public.alerts(user_id, created_at DESC);

CREATE POLICY "Owner manages alerts" ON public.alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Linked caregivers view alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (public.is_linked_caregiver(auth.uid(), user_id));
CREATE POLICY "Linked caregivers update alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (public.is_linked_caregiver(auth.uid(), user_id));

-- 8. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_meds_updated BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_links_updated BEFORE UPDATE ON public.caregiver_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'elderly'::app_role
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
