import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

const COLORS = {
  white: "#FFFFFF",
  offWhite: "#FFFDF8",

  softOrange: "#FFF1E6",
  burntOrange: "#C75A14",
  burntOrangeDark: "#8F3500",

  deepBlue: "#07427d",
  deepBlueSoft: "#073763",
  deepBlueLight: "#EAF2FF",

  mutedText: "#667085",
  border: "#E7EAF0",

  danger: "#B42318",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert("Missing details", "Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    router.replace("/employee");
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandSection}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>A</Text>
          </View>

          <Text style={styles.kicker}>AGAMII TIME TRACKER</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to start tracking your work session.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Employee Login</Text>
            <Text style={styles.cardSubtitle}>
              Use your registered email and password.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === "email" && styles.inputFocused,
                ]}
                placeholder="name@example.com"
                placeholderTextColor="#98A2B3"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === "password" && styles.inputFocused,
                ]}
                placeholder="Enter your password"
                placeholderTextColor="#98A2B3"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerTitle}>Today&apos;s work starts here</Text>
          <Text style={styles.footerText}>
            Clock in, manage breaks, and keep your work hours organized.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 70,
    paddingBottom: 40,
    justifyContent: "center",
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 34,
  },
  logoMark: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: COLORS.deepBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 7,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
  },
  kicker: {
    color: COLORS.burntOrange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  title: {
    color: COLORS.deepBlue,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    color: COLORS.deepBlue,
    fontSize: 23,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 6,
  },

  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: COLORS.deepBlue,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    height: 56,
    backgroundColor: COLORS.offWhite,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    color: COLORS.deepBlue,
    fontSize: 15,
    fontWeight: "700",
  },
  inputFocused: {
    borderColor: COLORS.burntOrange,
    backgroundColor: COLORS.white,
  },

  loginButton: {
    height: 58,
    borderRadius: 19,
    backgroundColor: COLORS.burntOrange,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: COLORS.burntOrange,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 5,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.65,
  },

  footerNote: {
    backgroundColor: COLORS.deepBlueLight,
    borderRadius: 24,
    padding: 18,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#D8E7FB",
  },
  footerTitle: {
    color: COLORS.deepBlue,
    fontSize: 15,
    fontWeight: "900",
  },
  footerText: {
    color: COLORS.deepBlueSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    marginTop: 5,
  },
});