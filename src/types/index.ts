export type UserRole = "employee" | "admin";

export type WorkStatus = "not_started" | "working" | "on_break" | "completed";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
};

export type TimeLog = {
  id: string;
  user_id: string;
  user_email: string | null;

  clock_in: string;
  clock_in_display: string;

  clock_out?: string | null;
  clock_out_display?: string | null;

  break_started_at?: string | null;
  break_started_display?: string | null;

  break_ended_at?: string | null;
  break_ended_display?: string | null;

  total_break_minutes: number;
  total_break_seconds: number;

  total_work_minutes?: number | null;
  total_work_seconds?: number | null;

  status: WorkStatus;
  note?: string | null;

  created_at?: string;
  updated_at?: string;
};