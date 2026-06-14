
export interface AuthResponse {
  success: boolean;
  user?: any;
  error?: any;
  url?: string; // OAuth flows
}

export interface AuthStrategy {
  authenticate(payload?: any): Promise<AuthResponse>;
}