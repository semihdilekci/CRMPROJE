export interface Team {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamWithUserCount extends Team {
  userCount: number;
}

