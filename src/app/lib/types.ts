export interface PasswordEntry {
  id: string;
  userProfileId: string;
  name: string;
  username: string;
  encryptedPassword: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  externalUserId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
