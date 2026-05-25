import "dotenv/config";

export default {
  expo: {
    name: "EdTech Time Tracker",
    slug: "edtech-time-tracker",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "edtech-time-tracker",
    userInterfaceStyle: "automatic",
    android: {
      package: "com.edtech.timetracker",
      versionCode: 1,
    },
    plugins: ["expo-router", "expo-secure-store", "expo-updates"],
    updates: {
      url: "YOUR_EAS_UPDATE_URL_AFTER_CONFIGURE",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      eas: {
        projectId: "YOUR_EAS_PROJECT_ID_AFTER_CONFIGURE",
      },
    },
  },
};
