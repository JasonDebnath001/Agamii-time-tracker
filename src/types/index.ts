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
  clock_in: string;
  clock_out?: string | null;
  break_started_at?: string | null;
  total_break_minutes: number;
  total_work_minutes?: number | null;
  status: WorkStatus;
  note?: string | null;
};