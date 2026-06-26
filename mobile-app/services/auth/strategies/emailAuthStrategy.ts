import { supabase } from '@/supabaseClient';
import { AuthStrategy, AuthResponse } from '../type';

export class EmailStrategy implements AuthStrategy {
  async authenticate(payload: {
    email: string;
    password: string;
    isRegistering: boolean;
  }): Promise<AuthResponse> {
    const { email, password, isRegistering } = payload;

    if (!isRegistering) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error };
      return { success: true, user: data.user };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error };

    // Supabase doesn't return an error for signUp on an existing email (to
    // avoid leaking which emails are registered): it responds with a user
    // object that looks new but has an empty identities array. The
    // localized message for this is resolved by the caller, since this
    // class isn't a React component/hook and can't call useLanguage().
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, accountExists: true };
    }

    return { success: true, user: data.user };
  }
}
