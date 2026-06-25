import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../../../supabaseClient";
import { AuthStrategy, AuthResponse } from "../type";

export class GoogleStrategy implements AuthStrategy {
  static getRedirectUrl(): string {
    return Platform.OS === "web" ? "http://localhost:8081" : Linking.createURL("home");
  }

  async authenticate(): Promise<AuthResponse> {
    const redirectUrl = GoogleStrategy.getRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) return { success: false, error };
    return { success: true, url: data?.url };
  }
}