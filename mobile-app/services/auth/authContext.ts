// services/auth/authContext.ts
import { supabase } from '@/services/supabaseClient';
import { AuthStrategy, AuthResponse } from './type';

export class AuthContext {
  private strategy!: AuthStrategy;

  // Permite cambiar la estrategia dinámicamente en tiempo de ejecución
  setStrategy(strategy: AuthStrategy) {
    this.strategy = strategy;
  }

  // Ejecuta la estrategia que esté activa en ese momento
  async executeAuth(payload?: any): Promise<AuthResponse> {
    if (!this.strategy) {
      throw new Error('No se ha seleccionado ninguna estrategia de autenticación.');
    }
    return this.strategy.authenticate(payload);
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error al cerrar sesión:', error.message);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unexpected error while signing out',
      };
    }
  }

  async getToken() {
    const { data } = await supabase.auth.getSession();
    let token = data.session?.access_token;
    if (token === null)
      throw new Error("Error while getting the user's token, it is null");
    return token;
  }
}

export const authContextManager = new AuthContext();
