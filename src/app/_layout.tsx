import React, { useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";
import { store } from "../store";
import { NavigationTabBar } from "../components/common/NavigationTabBar";
import { CustomSplashScreen } from "../components/common/CustomSplashScreen";
import { AuthSessionBootstrap } from "../components/common/AuthSessionBootstrap";
import { ResponseModalProvider } from "../components/common/ResponseModalContext";
import { useColorScheme } from "../hooks/use-color-scheme";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashReady, setIsSplashReady] = useState(false);

  return (
    <Provider store={store}>
      <AuthSessionBootstrap>
        <SafeAreaProvider>
          <ResponseModalProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
              <View style={styles.container}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#F9FAFB" },
                    animation: "fade",
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="products/index" />
                  <Stack.Screen name="products/[id]" />
                  <Stack.Screen name="cart/index" />
                  <Stack.Screen name="account/index" />
                  <Stack.Screen name="wishlist/index" />
                </Stack>

                {/* Dynamic Reusable Bottom Tab Navigator (Buyer or Seller Mode) */}
                <NavigationTabBar />

                {/* Splash Screen */}
                {!isSplashReady && (
                  <CustomSplashScreen onFinish={() => setIsSplashReady(true)} />
                )}
              </View>
              <StatusBar style="dark" />
            </ThemeProvider>
          </ResponseModalProvider>
        </SafeAreaProvider>
      </AuthSessionBootstrap>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
});
