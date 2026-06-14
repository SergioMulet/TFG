
import { Platform } from "react-native";
import { supabase } from "../../../supabaseClient";
import { AuthStrategy, AuthResponse } from "../type";

export class GoogleStrategy implements AuthStrategy {
  private getRedirectUrl(): string {
    return Platform.OS === "web" ? "http://localhost:8081" : "exp://192.168.1.135:8081";
  }

  async authenticate(): Promise<AuthResponse> {
    const redirectUrl = this.getRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    });

    if (error) return { success: false, error };
    return { success: true, url: data?.url };
  }
}