export type Role = 'admin' | 'school' | 'teacher' | 'student' | 'parent';

export interface User {
  id: number;
  role: Role;
  name: string;
  username: string;
  schoolId: number | null;
  sectionId: number | null;
  mustChangePassword: boolean;
}

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  school: '/school',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent'
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'VINC admin',
  school: 'School admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent'
};
