export interface PasswordEntry {
  id: string;
  user_id?: string;
  userProfileId?: string;
  name: string;
  username: string;
  password?: string;
  encrypted_password?: string;
  encryptedPassword?: string;
  url?: string;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  two_factor_enabled?: boolean;
  twoFactorEnabled?: boolean;
  two_factor_secret?: string;
  twoFactorSecret?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}
