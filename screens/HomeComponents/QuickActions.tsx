import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from '../../navigation/types';
import TransactionPage from "./TransactionPage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const QuickActions: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Saved</Text>
      </TouchableOpacity>
    
      <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("TransactionPage")}
        >
          <Text style={styles.buttonText}>Transactions</Text>
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
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default QuickActions;
