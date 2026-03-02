// ui/auth/AuthSession.ts

export type AuthSession = {
  authenticated: boolean;
  user_id?: string;
  is_founder?: boolean;
};