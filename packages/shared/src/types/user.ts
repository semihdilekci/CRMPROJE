import { UserRole } from '../constants/enums';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
   /**
    * Kullanıcının bağlı olduğu ekip (nullable: eski kayıtlar için).
    */
  teamId?: string | null;
  teamName?: string | null;
  createdAt: string;
  updatedAt: string;
}
