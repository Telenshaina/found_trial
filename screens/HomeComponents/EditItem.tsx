import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface EditItemProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editData: {
    itemName: string;
    description: string;
  };
  setEditData: React.Dispatch<React.SetStateAction<{
    itemName: string;
    description: string;
  }>>;
}

const EditItem: React.FC<EditItemProps> = ({ visible, onClose, onSubmit, editData, setEditData }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>

          <Text style={styles.title}>Edit Found Item</Text>
          <Text style={styles.description}>
            Update the details of the item you found. Please make sure to provide accurate information.
          </Text>

          <Text style={styles.label}>Item Name</Text>
          <TextInput style={styles.input} placeholder="Item Name" value={editData.itemName}
            onChangeText={(text) => setEditData({ ...editData, itemName: text })} />

          <Text style={styles.label}>Item Description</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Description"
            multiline
            value={editData.description}
            onChangeText={(text) => setEditData({ ...editData, description: text })}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={onClose} >
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: '#28a745'}]} onPress={onSubmit}>
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", },
  container: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 10, elevation: 5, },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 5, },
  description: { fontSize: 14, color: "#666", marginBottom: 15, },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#333', },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, },
  button: { flex: 1, backgroundColor: "#000", padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 5, },
  buttonText: { color: "#fff", fontWeight: "bold", },
});

export default EditItem;