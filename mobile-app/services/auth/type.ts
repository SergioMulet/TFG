
export interface AuthResponse {
  success: boolean;
  user?: any;
  error?: any;
  url?: string; // OAuth flows
  accountExists?: boolean;
}

export interface AuthStrategy {
  authenticate(payload?: any): Promise<AuthResponse>;
}