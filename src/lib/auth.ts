import { supabase } from "@/integrations/supabase/client";

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Route target for the signed-in user: admins get the dashboard, everyone else the ticket desk. */
export async function landingPathForCurrentUser(): Promise<"/dashboard" | "/tickets"> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return "/tickets";
  return data === true ? "/dashboard" : "/tickets";
}
