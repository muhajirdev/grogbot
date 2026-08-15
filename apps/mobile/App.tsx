import { createGrogbotClient } from "@grogbot/rpc";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const client = createGrogbotClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3100",
});

export function App() {
  const [health, setHealth] = useState("checking…");

  useEffect(() => {
    void client
      .health()
      .then((payload) => setHealth(`${payload.runtime} · ${payload.wakeup}`))
      .catch((error: unknown) =>
        setHealth(error instanceof Error ? error.message : "offline"),
      );
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Grogbot</Text>
      <Text style={styles.title}>Mobile later. Same oRPC.</Text>
      <Text style={styles.body}>
        v1 UI is the web app. This Expo shell talks to the same contract.
      </Text>
      <Text style={styles.meta}>{health}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f5f2",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  kicker: {
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6b6b70",
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
  body: {
    color: "#444",
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    fontFamily: "monospace",
    color: "#111",
  },
});
