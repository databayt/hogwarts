export interface School {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  timezone?: string;
  locale?: string;
  planType?: string;
  maxStudents?: number;
  maxTeachers?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SchoolResult {
  success: boolean;
  data?: School;
  error?: string;
}
