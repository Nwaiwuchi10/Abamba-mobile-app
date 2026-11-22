import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ScrollViewProps,
  ViewStyle,
} from "react-native";

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  extraHeight?: number;
}

/**
 * KeyboardAwareScrollView
 * High-performance, universal keyboard-avoiding scroll wrapper for all input screens in Abamba.
 * Works seamlessly across iOS, Android, and Web without third-party native linking bugs.
 */
export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  contentContainerStyle,
  extraHeight = 40,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  ...rest
}) => {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScrollView
        {...rest}
        style={styles.flex}
        contentContainerStyle={[contentContainerStyle, { paddingBottom: extraHeight }]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default KeyboardAwareScrollView;
