import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../supabase";

interface ClaimReportModalProps {
  itemId: string;  // Expected to pass itemId here from parent component
  visible: boolean;
  handleClose: () => void;
  user: { name: string; email: string; phone: string };
  isSubmitting: boolean;
  reason: string;
  handleSubmitClaim: (data: {
    reason: string;
    imageUri: string | null;
    user: { name: string; email: string; phone: string };
    item_id: string;
  }) => void;
  handlePickImage: () => Promise<void>;
}

const ClaimReportModal: React.FC<ClaimReportModalProps> = ({
  visible,
  handleClose,
  user,
  isSubmitting,
  handleSubmitClaim,
  itemId, 
}) => {
  const [reason, setReason] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);

  // Fetch item details based on itemId when modal is visible
  useEffect(() => {
    if (visible) {
      const fetchItem = async () => {
        try {

          const { data, error } = await supabase
            .from("found_items")
            .select("*")
            .eq("item_id", itemId)
            .single(); 

          if (data) {
            setItem(data);
          } else {
            console.error("Error fetching item details:", error);
            alert("Failed to fetch item details.");
          }
        } catch (error) {
          console.error("Error fetching item details:", error);
          alert("Failed to fetch item details.");
        }
      };

      fetchItem();
    }
  }, [visible, itemId]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please enter a reason for your claim.");
      return;
    }

    if (!item || !item.item_id) {
      alert("Invalid item information.");
      console.error("Item or item_id is missing:", item);
      return;
    }

    const item_id = item.item_id; 
    console.log("Item ID:", item_id);

    handleSubmitClaim({
      reason,
      imageUri,
      user,
      item_id,
    });

    setReason("");
    setImageUri(null);
    handleClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>File a Claim Report</Text>

          <Text>NAME: {user.name} </Text>
          <Text>EMAIL: {user.email}</Text>
          <Text>CONTACT: {user.phone}</Text>

          {item ? (
            <>
              {/* <Text>Item Name: {item.item_name}</Text> */}
              {/* <Text>Description: {item.description}</Text> */}
            </>
          ) : (
            <Text>Loading item details...</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Enter your reason..."
            multiline
            value={reason}
            onChangeText={setReason}
          />

          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Text style={styles.attachText}>Attach Image</Text>
          </TouchableOpacity>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && { backgroundColor: "#ccc" }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.claimButtonText}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: "#ccc" }]}
              onPress={handleClose}
            >
              <Text style={styles.claimButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    height: 80,
    textAlignVertical: "top",
  },
  attachButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  attachText: {
    color: "white",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 5,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  claimButtonText: {
    color: "#fff",
    textAlign: "center",
  },
});

export default ClaimReportModal;