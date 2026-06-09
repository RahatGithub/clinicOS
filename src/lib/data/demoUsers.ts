import type { DemoUser } from '@/types'

export const demoUsers: DemoUser[] = [
  {
    id: 'USR-001',
    name: 'Arjun Kapoor',
    role: 'super_admin',
    email: 'admin@clinicos.io',
    password: 'demo1234',
    tenantId: null,
  },
  {
    id: 'USR-002',
    name: 'Dr. Helen Mirowski',
    role: 'center_admin',
    email: 'director@northgate.health',
    password: 'demo1234',
    tenantId: 'TEN-001',
  },
  {
    id: 'STF-10001',
    name: 'Dr. Kwame Mensah',
    role: 'doctor',
    email: 'dr.mensah@northgate.health',
    password: 'demo1234',
    tenantId: 'TEN-001',
  },
  {
    id: 'STF-89856',
    name: 'Ruby Classius',
    role: 'nurse',
    email: 'nurse.ruby@northgate.health',
    password: 'demo1234',
    tenantId: 'TEN-001',
  },
  {
    id: 'STF-30010',
    name: 'Marcus Webb',
    role: 'receptionist',
    email: 'reception@northgate.health',
    password: 'demo1234',
    tenantId: 'TEN-001',
  },
]
