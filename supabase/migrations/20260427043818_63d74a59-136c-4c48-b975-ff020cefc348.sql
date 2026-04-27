-- Fix privilege escalation: prevent users from granting themselves roles
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restrict elderly status updates on caregiver_links to accepted/rejected only
DROP POLICY IF EXISTS "Elderly updates link status" ON public.caregiver_links;

CREATE POLICY "Elderly updates link status" ON public.caregiver_links
  FOR UPDATE TO authenticated
  USING (auth.uid() = elderly_id)
  WITH CHECK (auth.uid() = elderly_id AND status IN ('accepted', 'rejected'));