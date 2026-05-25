import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type Status = "not_started" | "working" | "on_break" | "completed";

export default function EmployeeHomeScreen() {
  const [status, setStatus] = useState<Status>("not_started");

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Current Status</Text>
        <Text style={styles.status}>
          {status.replace("_", " ").toUpperCase()}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => setStatus("working")}
        >
          <Text style={styles.buttonText}>Clock In</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setStatus("on_break")}
        >
          <Text style={styles.secondaryText}>Start Break</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setStatus("working")}
        >
          <Text style={styles.secondaryText}>End Break</Text>
        </Pressable>

        <Pressable
          style={styles.dangerButton}
          onPress={() => setStatus("completed")}
        >
          <Text style={styles.buttonText}>Clock Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    color: "#64748b",
    fontSize: 14,
  },
  status: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "800",
    color: "#2563eb",
  },
  actions: {
    gap: 14,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  dangerButton: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "700",
  },
});
