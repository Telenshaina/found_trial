import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

interface QuickActionsProps {
  disabled: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ disabled }) => {
  const navigation = useNavigation<NavigationProp>();

  const handleNavigate = <T extends keyof RootStackParamList>(screen: T) => {
    if (!disabled) {
      navigation.navigate(screen as any); // fallback if you're confident in screen names
    }
  };
  

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={() => handleNavigate("ClaimedItems")}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, disabled && styles.disabledText]}>
          All Claimed Items
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={() => handleNavigate("TransactionPage")}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, disabled && styles.disabledText]}>
          Transactions
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  disabledText: {
    color: "#999",
  },
});

export default QuickActions;
