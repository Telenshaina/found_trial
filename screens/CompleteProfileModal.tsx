// components/CompleteProfileModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface Props {
  visible: boolean;
  onClose: () => void;
  userType: "guest" | "institutional";
}

const CompleteProfileModal: React.FC<Props> = ({ visible, onClose, userType }) => {
  const navigation = useNavigation();

  const handleContinue = () => {
    onClose(); // Optional: hide modal first
    navigation.navigate("Account" as never); // Redirect to Setup or Account screen
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.message}>
            It looks like your profile is missing some important information. Please complete it to proceed.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CompleteProfileModal;
