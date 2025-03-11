import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";

type RootStackParamList = {
  Setup: undefined;
  Main: undefined;
};

const Setup: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing Information", "Please enter your First and Last Name.");
      return;
    }

    navigation.navigate("Main"); // ✅ Use navigate instead of replace
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Guest Setup</Text>
      <Text style={styles.subText}>Enter your details to continue.</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name*"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Middle Initial (Optional)"
        value={middleInitial}
        onChangeText={setMiddleInitial}
        maxLength={1}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name*"
        value={lastName}
        onChangeText={setLastName}
      />

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  continueButton: {
    backgroundColor: "green",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Setup;