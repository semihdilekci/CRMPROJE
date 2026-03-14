import { UserRole } from '../constants/enums';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** E.164 format (örn: +905551234567). MFA SMS için kullanılır. */
  phone?: string | null;
  /**
   * Kullanıcının bağlı olduğu ekip (nullable: eski kayıtlar için).
   */
  teamId?: string | null;
  teamName?: string | null;
  createdAt: string;
  updatedAt: string;
}
