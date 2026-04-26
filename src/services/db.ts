// Typed data access layer for Elara Voice.
// Always uses the authenticated supabase client; RLS enforces ownership/caregiver access.
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

/* ---------- Profiles ---------- */
export const profilesApi = {
  async get(userId: string) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async update(userId: string, patch: TablesUpdate<"profiles">) {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().maybeSingle();
    if (error) throw error;
    return data;
  },
};

/* ---------- Roles ---------- */
export const rolesApi = {
  async myRoles(): Promise<Tables<"user_roles">["role"][]> {
    const { data, error } = await supabase.from("user_roles").select("role");
    if (error) throw error;
    return (data ?? []).map((r) => r.role);
  },
};

/* ---------- Medications ---------- */
export const medicationsApi = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async create(input: Omit<TablesInsert<"medications">, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase.from("medications").insert(input).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: TablesUpdate<"medications">) {
    const { data, error } = await supabase.from("medications").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async remove(id: string) {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ---------- Medication logs ---------- */
export const medLogsApi = {
  async list(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("medication_logs")
      .select("*, medications(name, dosage)")
      .eq("user_id", userId)
      .order("taken_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  async log(input: Omit<TablesInsert<"medication_logs">, "id" | "taken_at">) {
    const { data, error } = await supabase.from("medication_logs").insert(input).select().maybeSingle();
    if (error) throw error;
    return data;
  },
};

/* ---------- Check-ins ---------- */
export const checkInsApi = {
  async list(userId: string, limit = 30) {
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  async create(input: Omit<TablesInsert<"check_ins">, "id" | "created_at">) {
    const { data, error } = await supabase.from("check_ins").insert(input).select().maybeSingle();
    if (error) throw error;
    return data;
  },
};

/* ---------- Caregiver links ---------- */
export const linksApi = {
  async mine(userId: string) {
    const { data, error } = await supabase
      .from("caregiver_links")
      .select("*")
      .or(`caregiver_id.eq.${userId},elderly_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async invite(caregiverId: string, elderlyId: string) {
    const { data, error } = await supabase
      .from("caregiver_links")
      .insert({ caregiver_id: caregiverId, elderly_id: elderlyId, status: "pending" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async respond(linkId: string, status: "accepted" | "rejected") {
    const { data, error } = await supabase
      .from("caregiver_links")
      .update({ status })
      .eq("id", linkId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async remove(linkId: string) {
    const { error } = await supabase.from("caregiver_links").delete().eq("id", linkId);
    if (error) throw error;
  },
};

/* ---------- Alerts ---------- */
export const alertsApi = {
  async list(userId: string, includeResolved = false) {
    let q = supabase.from("alerts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (!includeResolved) q = q.eq("resolved", false);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  async resolve(id: string) {
    const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", id);
    if (error) throw error;
  },
};
