// ── DATA TYPES ─────────────────────────────────────────────────────────────────

export interface Tutor {
  id: string;
  full_name: string;
  location: string;
  subjects: string[];
  experience_years: number;
  hourly_rate: number;
  average_rating: number;
  total_sessions: number;
  total_likes: number;
  response_time_hours: number;
  completion_rate: number;
  verified: boolean;
  qualifications: string;
  bio: string;
}

export interface Parent {
  id: string;
  full_name: string;
  email: string;
  location: string;
  subjects_needed: string[];
  child_grade: string;
  total_bookings: number;
  role: "parent" | "tutor" | "admin";
}

export interface Booking {
  id: string;
  parent_id: string;
  tutor_id: string;
  subjects: string[];
  session_date: number;
  duration_hours: number;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  location: string;
  notes?: string;
  total_cost: number;
}

export interface Rating {
  id: string;
  tutor_id: string;
  parent_id: string;
  rating_score: number;
  review_text: string;
  review_date: number;
}

export interface Like {
  id: string;
  tutor_id: string;
  parent_id: string;
  liked: boolean;
}

export interface ParentMessage {
  id: string;
  parent_id: string;
  tutor_id: string;
  progress_entry_id: string;
  subject: string;
  topic: string;
  performance: "Excellent" | "Good" | "Needs Work" | "Struggling";
  notes: string;
  date: number;
  read: boolean;
}

export interface ProgressEntry {
  id: string;
  tutor_id: string;
  parent_id: string;
  subject: string;
  date: number;
  topic: string;
  performance: "Excellent" | "Good" | "Needs Work" | "Struggling";
  notes: string;
}

export interface StudentProgress {
  parent_id: string;
  tutor_id: string;
  entries: ProgressEntry[];
}

export interface Filters {
  subject: string;
  location: string;
  experience: string;
  rating: string;
  sort: string;
}

// ── AUTH TYPES ─────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location?: string;
  device: string | null;
  role: "Parent" | "Tutor" | "Admin";
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  password_confirm: string;
  role: "Parent" | "Tutor" | "Admin";
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number: string;
  location: string;
  digital_address?: string;
  // Parent
  child_name?: string;
  child_grade?: string;
  subjects_needed?: string[];
  // Tutor
  subjects_taught?: string[];
  experience_years?: number;
  hourly_rate?: number;
  qualifications?: string;
  academic_levels?: string[];
  bio?: string;
}

export interface LoginResponse {
  user: ApiUser;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ── APP TYPES ──────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  location: string;
  role: "Parent" | "Tutor" | "Admin";
  is_verified: boolean;
  is_active: boolean;
  subjects_needed?: string[];
  child_grade?: string;
  child_name?: string;
}

export interface Notification {
  message: string;
  type: "success" | "error" | "info";
}

export type Page =
  | "home"
  | "tutors"
  | "dashboard"
  | "tutor-dashboard"
  | "analytics"
  | "admin"
  | "about"
  | "login"
  | "register";