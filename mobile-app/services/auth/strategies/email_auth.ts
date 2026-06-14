import { supabase } from "@/supabaseClient";
import { AuthStrategy, AuthResponse } from "../type";

export class EmailStrategy implements AuthStrategy {
  async authenticate(payload: {
    email: string;
    password: string;
    isRegistering: boolean;
  }): Promise<AuthResponse> {
    const { email, password, isRegistering } = payload;

    const { data, error } = isRegistering
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) return { success: false, error };
    return { success: true, user: data.user };
  }
}
