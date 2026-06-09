export type Role =
  | 'super_admin'
  | 'center_admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'

export interface Tenant {
  id: string
  name: string
  logoUrl?: string
  coverImageUrl?: string
  adminName: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  plan: 'basic' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  registeredDate: string
  userCount: number
  primaryColor?: string
}

export interface Plan {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  userLimit: number | 'unlimited'
  patientLimit: number | 'unlimited'
  activeSubscribers: number
}

export interface Payment {
  id: string
  tenantId: string
  tenantName: string
  plan: string
  amount: number
  currency: 'USD' | 'EUR' | 'AUD' | 'GBP'
  date: string
  status: 'paid' | 'overdue' | 'failed' | 'refunded'
  transactionId: string
}

export interface StaffMember {
  id: string
  name: string
  role: Exclude<Role, 'super_admin'>
  email: string
  phone: string
  dob: string
  gender: 'male' | 'female' | 'other'
  nationalId: string
  avatarUrl?: string
  status: 'active' | 'on_leave' | 'inactive'
  specialty?: string
  qualifications?: string
  assignedDoctorId?: string
  joinedDate: string
}

export interface Patient {
  id: string
  name: string
  dob: string
  gender: 'male' | 'female' | 'other'
  email: string
  phone: string
  avatarUrl?: string
  nationalId?: string
  insurance?: {
    provider: string
    policyNumber: string
    healthId: string
  }
  address?: {
    street: string
    city: string
    state: string
    country: string
  }
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  assignedDoctorId?: string
  registeredDate: string
  lastVisit?: string
}

export interface StaticHealthInfo {
  patientId: string
  bloodGroup?: string
  heightCm?: number
  weightKg?: number
  allergies: string[]
  chronicConditions: string[]
  currentMedications: string[]
  smoking: 'never' | 'former' | 'current' | 'unknown'
  alcohol: 'never' | 'occasional' | 'regular' | 'unknown'
}

export type HealthMetricType =
  | 'blood_pressure'
  | 'blood_glucose'
  | 'heart_rate'
  | 'spo2'
  | 'temperature'
  | 'respiratory_rate'
  | 'cholesterol_total'
  | 'hemoglobin'
  | 'creatinine'
  | 'tsh'
  | 'bmi'
  | 'platelet_count'

export interface HealthMetricEntry {
  id: string
  patientId: string
  type: HealthMetricType
  label: string
  value: string
  unit: string
  recordedAt: string
  recordedById: string
  recordedByName: string
  recordedByRole: Role
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  specialty: string
  dateTime: string
  durationMin: number
  reason: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  checkInStatus?: 'not_arrived' | 'waiting' | 'with_doctor' | 'done'
}

export interface PrescriptionMedicine {
  name: string
  dose: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Prescription {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  appointmentId?: string
  date: string
  chiefComplaint: string
  diagnosis: string
  medicines: PrescriptionMedicine[]
  testsSuggested: string[]
  todos: string[]
  notTodos: string[]
  followUpDate?: string
  notes?: string
}

export interface ActivityLog {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: Role
  action: string
  actionType:
    | 'patient'
    | 'appointment'
    | 'metric'
    | 'prescription'
    | 'staff'
    | 'settings'
    | 'auth'
    | 'billing'
  patientId?: string
  patientName?: string
  oldValue?: string
  newValue?: string
}

export interface DemoUser {
  id: string
  name: string
  role: Role
  email: string
  password: string
  avatarUrl?: string
  tenantId: string | null
}
