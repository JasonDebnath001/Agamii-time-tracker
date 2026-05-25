import { Redirect } from "expo-router";

export default function Index() {
  const isLoggedIn = false;
  const role = "employee";

  if (!isLoggedIn) return <Redirect href="/login" />;

  if (role === "admin") return <Redirect href="/admin" />;

  return <Redirect href="/employee" />;
}
