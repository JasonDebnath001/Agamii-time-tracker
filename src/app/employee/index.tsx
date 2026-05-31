import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Status = "not_started" | "working" | "on_break" | "completed";

type TodayLog = {
  id: string;
  user_id: string;
  user_email: string | null;

  clock_in: string;
  clock_in_display: string;

  clock_out: string | null;
  clock_out_display: string | null;

  break_started_at: string | null;
  break_started_display: string | null;

  break_ended_at: string | null;
  break_ended_display: string | null;

  total_break_minutes: number;
  total_break_seconds: number;

  total_work_minutes: number | null;
  total_work_seconds: number | null;

  status: Status;
};

const COLORS = {
  white: "#FFFFFF",
  offWhite: "#FFFDF8",

  softOrange: "#FFF1E6",
  burntOrange: "#C75A14",
  burntOrangeDark: "#8F3500",

  deepBlue: "#054d95",
  deepBlueSoft: "#073763",
  deepBlueLight: "#EAF2FF",

  mutedText: "#667085",
  border: "#E7EAF0",

  success: "#16803C",
  danger: "#B42318",
};

function getNowValues() {
  const now = new Date();

  return {
    date: now,
    iso: now.toISOString(),
    display: now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  };
}

function getTodayStartIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function calculateSeconds(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  return Math.max(0, Math.floor((end - start) / 1000));
}

function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

function formatSeconds(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return "0 sec";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min ${secs} sec`;
  }

  if (minutes > 0) {
    return `${minutes} min ${secs} sec`;
  }

  return `${secs} sec`;
}

function getStatusLabel(status: Status) {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "working":
      return "Working";
    case "on_break":
      return "On Break";
    case "completed":
      return "Completed";
    default:
      return "Not Started";
  }
}

function getStatusDescription(status: Status) {
  switch (status) {
    case "not_started":
      return "Ready to begin your work session.";
    case "working":
      return "Your active work session is being tracked.";
    case "on_break":
      return "Break time is being counted separately.";
    case "completed":
      return "Your previous work session has been saved.";
    default:
      return "";
  }
}

function getStatusDotColor(status: Status) {
  switch (status) {
    case "working":
      return COLORS.success;
    case "on_break":
      return COLORS.burntOrange;
    case "completed":
      return COLORS.deepBlue;
    default:
      return COLORS.mutedText;
  }
}

export default function EmployeeHomeScreen() {
  const [log, setLog] = useState<TodayLog | null>(null);
  const [status, setStatus] = useState<Status>("not_started");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function loadLatestLogForToday() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    const { data, error } = await supabase
      .from("time_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("clock_in", getTodayStartIso())
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setLoading(false);
      Alert.alert("Error", error.message);
      return;
    }

    if (data) {
      setLog(data as TodayLog);
      setStatus(data.status as Status);
    } else {
      setLog(null);
      setStatus("not_started");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLatestLogForToday();
  }, []);

  const liveBreakSeconds = useMemo(() => {
    if (!log) return 0;

    const savedBreakSeconds = Number(log.total_break_seconds || 0);

    if (status === "on_break" && log.break_started_at) {
      const activeBreakSeconds = calculateSeconds(
        log.break_started_at,
        currentTime.toISOString(),
      );

      return savedBreakSeconds + activeBreakSeconds;
    }

    return savedBreakSeconds;
  }, [log, status, currentTime]);

  const liveWorkedSeconds = useMemo(() => {
    if (!log) return 0;

    if (status === "completed") {
      return Number(log.total_work_seconds || 0);
    }

    if (status === "not_started") {
      return 0;
    }

    const totalSessionSeconds = calculateSeconds(
      log.clock_in,
      currentTime.toISOString(),
    );

    return Math.max(0, totalSessionSeconds - liveBreakSeconds);
  }, [log, status, currentTime, liveBreakSeconds]);

  async function handleClockIn() {
    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    const now = getNowValues();

    const { data, error } = await supabase
      .from("time_logs")
      .insert({
        user_id: user.id,
        user_email: user.email ?? "unknown",

        clock_in: now.iso,
        clock_in_display: now.display,

        clock_out: null,
        clock_out_display: null,

        break_started_at: null,
        break_started_display: null,

        break_ended_at: null,
        break_ended_display: null,

        total_break_seconds: 0,
        total_break_minutes: 0,

        total_work_seconds: null,
        total_work_minutes: null,

        status: "working",
        updated_at: now.iso,
      })
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      Alert.alert("Clock In Failed", error.message);
      return;
    }

    setLog(data as TodayLog);
    setStatus("working");
  }

  async function handleStartBreak() {
    if (!log) return;

    setSaving(true);

    const now = getNowValues();

    const { data, error } = await supabase
      .from("time_logs")
      .update({
        break_started_at: now.iso,
        break_started_display: now.display,
        status: "on_break",
        updated_at: now.iso,
      })
      .eq("id", log.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      Alert.alert("Start Break Failed", error.message);
      return;
    }

    setLog(data as TodayLog);
    setStatus("on_break");
  }

  async function handleEndBreak() {
    if (!log || !log.break_started_at) return;

    setSaving(true);

    const now = getNowValues();

    const currentBreakSeconds = calculateSeconds(log.break_started_at, now.iso);
    const newTotalBreakSeconds =
      Number(log.total_break_seconds || 0) + currentBreakSeconds;

    const newTotalBreakMinutes = secondsToMinutes(newTotalBreakSeconds);

    const { data, error } = await supabase
      .from("time_logs")
      .update({
        break_ended_at: now.iso,
        break_ended_display: now.display,

        total_break_seconds: newTotalBreakSeconds,
        total_break_minutes: newTotalBreakMinutes,

        status: "working",
        updated_at: now.iso,
      })
      .eq("id", log.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      Alert.alert("End Break Failed", error.message);
      return;
    }

    setLog(data as TodayLog);
    setStatus("working");
  }

  async function handleClockOut() {
    if (!log) return;

    setSaving(true);

    const now = getNowValues();

    let finalBreakSeconds = Number(log.total_break_seconds || 0);

    if (status === "on_break" && log.break_started_at) {
      finalBreakSeconds += calculateSeconds(log.break_started_at, now.iso);
    }

    const totalSessionSeconds = calculateSeconds(log.clock_in, now.iso);
    const totalWorkSeconds = Math.max(
      0,
      totalSessionSeconds - finalBreakSeconds,
    );

    const finalBreakMinutes = secondsToMinutes(finalBreakSeconds);
    const totalWorkMinutes = secondsToMinutes(totalWorkSeconds);

    const { data, error } = await supabase
      .from("time_logs")
      .update({
        clock_out: now.iso,
        clock_out_display: now.display,

        break_ended_at:
          status === "on_break" && log.break_started_at
            ? now.iso
            : log.break_ended_at,

        break_ended_display:
          status === "on_break" && log.break_started_at
            ? now.display
            : log.break_ended_display,

        total_break_seconds: finalBreakSeconds,
        total_break_minutes: finalBreakMinutes,

        total_work_seconds: totalWorkSeconds,
        total_work_minutes: totalWorkMinutes,

        status: "completed",
        updated_at: now.iso,
      })
      .eq("id", log.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      Alert.alert("Clock Out Failed", error.message);
      return;
    }

    setLog(data as TodayLog);
    setStatus("completed");
  }

  const canClockIn = status === "not_started" || status === "completed";
  const canStartBreak = status === "working";
  const canEndBreak = status === "on_break";
  const canClockOut = status === "working" || status === "on_break";

  const currentTimeDisplay = currentTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const currentDateDisplay = currentTime.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.burntOrange} />
          <Text style={styles.loadingTitle}>Preparing your workspace</Text>
          <Text style={styles.loadingText}>Loading today&apos;s log...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>AGAMII TIME TRACKER</Text>
          <Text style={styles.heading}>Today&apos;s Session</Text>
          <Text style={styles.subheading}>{currentDateDisplay}</Text>
        </View>

        <View style={styles.clockPill}>
          <Text style={styles.clockText}>{currentTimeDisplay}</Text>
          <Text style={styles.clockLabel}>IST</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroLabel}>Current Status</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusDotColor(status) },
                ]}
              />
              <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {status === "completed" ? "Saved" : "Live"}
            </Text>
          </View>
        </View>

        <Text style={styles.statusDescription}>
          {getStatusDescription(status)}
        </Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricBoxPrimary}>
            <Text style={styles.metricLabel}>Worked Time</Text>
            <Text style={styles.metricValue}>
              {formatSeconds(liveWorkedSeconds)}
            </Text>
          </View>

          <View style={styles.metricBoxSecondary}>
            <Text style={styles.metricLabel}>Break Time</Text>
            <Text style={styles.metricValueSecondary}>
              {formatSeconds(liveBreakSeconds)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actions}>
          {canClockIn && (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressedButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleClockIn}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? "Saving..."
                  : status === "completed"
                    ? "Clock In Again"
                    : "Clock In"}
              </Text>
            </Pressable>
          )}

          {canStartBreak && (
            <Pressable
              style={({ pressed }) => [
                styles.outlineButton,
                pressed && styles.pressedButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleStartBreak}
              disabled={saving}
            >
              <Text style={styles.outlineButtonText}>
                {saving ? "Saving..." : "Start Break"}
              </Text>
            </Pressable>
          )}

          {canEndBreak && (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.orangeButton,
                pressed && styles.pressedButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleEndBreak}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? "Saving..." : "End Break"}
              </Text>
            </Pressable>
          )}

          {canClockOut && (
            <Pressable
              style={({ pressed }) => [
                styles.deepButton,
                pressed && styles.pressedButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleClockOut}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? "Saving..." : "Clock Out"}
              </Text>
            </Pressable>
          )}
        </View>

        {status === "completed" && (
          <View style={styles.completedNotice}>
            <Text style={styles.completedNoticeTitle}>Session completed</Text>
            <Text style={styles.completedNoticeText}>
              Your previous work session is saved. You can clock in again if
              needed.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <Text style={styles.sectionTitle}>Session Details</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Employee</Text>
          <Text style={styles.detailValue}>
            {log?.user_email || "Not available"}
          </Text>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineMarkerActive} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Clock In</Text>
              <Text style={styles.timelineValue}>
                {log?.clock_in_display || "Not clocked in"}
              </Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineMarkerOrange} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Break Started</Text>
              <Text style={styles.timelineValue}>
                {log?.break_started_display || "No break started"}
              </Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineMarkerOrangeLight} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Break Ended</Text>
              <Text style={styles.timelineValue}>
                {log?.break_ended_display || "No break ended"}
              </Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineMarkerDeep} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Clock Out</Text>
              <Text style={styles.timelineValue}>
                {log?.clock_out_display || "Not clocked out"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  content: {
    padding: 22,
    paddingTop: 54,
    paddingBottom: 44,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 5,
  },
  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  loadingText: {
    marginTop: 6,
    color: COLORS.mutedText,
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    marginBottom: 22,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "900",
    color: COLORS.burntOrange,
    marginBottom: 8,
  },
  heading: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: COLORS.deepBlue,
  },
  subheading: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.mutedText,
    fontWeight: "600",
  },
  clockPill: {
    backgroundColor: COLORS.deepBlue,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    minWidth: 108,
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  clockText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  clockLabel: {
    color: "#BFD0E4",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: 1,
  },

  heroCard: {
    backgroundColor: COLORS.deepBlue,
    borderRadius: 32,
    padding: 24,
    overflow: "hidden",
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 7,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  heroLabel: {
    color: "#BFD0E4",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  statusDescription: {
    marginTop: 14,
    color: "#D6E2F0",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  metricBoxPrimary: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
  },
  metricBoxSecondary: {
    flex: 1,
    backgroundColor: COLORS.softOrange,
    borderRadius: 22,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: "800",
    marginBottom: 7,
  },
  metricValue: {
    color: COLORS.deepBlue,
    fontSize: 18,
    fontWeight: "900",
  },
  metricValueSecondary: {
    color: COLORS.burntOrangeDark,
    fontSize: 18,
    fontWeight: "900",
  },

  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 4,
  },
  sectionTitle: {
    color: COLORS.deepBlue,
    fontSize: 18,
    fontWeight: "900",
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.burntOrange,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: COLORS.burntOrange,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  orangeButton: {
    backgroundColor: COLORS.burntOrange,
  },
  deepButton: {
    backgroundColor: COLORS.deepBlue,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  outlineButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.burntOrange,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
  outlineButtonText: {
    color: COLORS.burntOrange,
    fontSize: 15,
    fontWeight: "900",
  },
  pressedButton: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  disabledButton: {
    opacity: 0.6,
  },
  completedNotice: {
    marginTop: 16,
    backgroundColor: COLORS.paleBlue,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D8E7FB",
  },
  completedNoticeTitle: {
    color: COLORS.deepBlue,
    fontWeight: "900",
    fontSize: 14,
  },
  completedNoticeText: {
    color: COLORS.deepBlueSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: "600",
  },

  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 4,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    marginBottom: 18,
  },
  detailsHint: {
    color: COLORS.burntOrange,
    fontSize: 12,
    fontWeight: "900",
  },
  detailItem: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  detailLabel: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },
  detailValue: {
    color: COLORS.deepBlue,
    fontSize: 15,
    fontWeight: "800",
  },

  timeline: {
    paddingTop: 2,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 2,
  },
  timelineLabel: {
    color: COLORS.mutedText,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  timelineValue: {
    color: COLORS.deepBlue,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  timelineMarkerActive: {
    width: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: COLORS.success,
    marginTop: 2,
  },
  timelineMarkerOrange: {
    width: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: COLORS.burntOrange,
    marginTop: 2,
  },
  timelineMarkerOrangeLight: {
    width: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: "#E8A15F",
    marginTop: 2,
  },
  timelineMarkerDeep: {
    width: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: COLORS.deepBlue,
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
    marginLeft: 7,
    marginVertical: 4,
  },
});
