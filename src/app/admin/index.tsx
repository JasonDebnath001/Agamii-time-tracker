import { View, Text, StyleSheet } from "react-native";

export default function AdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Admin Dashboard</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.number}>0</Text>
          <Text style={styles.label}>Working</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.number}>0</Text>
          <Text style={styles.label}>On Break</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.number}>0</Text>
          <Text style={styles.label}>Not Clocked In</Text>
        </View>
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
    marginTop: 40,
    fontSize: 28,
    fontWeight: "800",
  },
  grid: {
    marginTop: 24,
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  number: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2563eb",
  },
  label: {
    marginTop: 6,
    color: "#64748b",
  },
});
