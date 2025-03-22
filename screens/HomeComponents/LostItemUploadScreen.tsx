import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons'; // Import icon library

const LostItemUploadScreen = () => {
  const navigation = useNavigation();
  const [itemName, setItemName] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [description, setDescription] = useState('');

  const uploadLostItem = () => {
    if (!itemName || !locationLost || !description) {
      alert('Please fill in all fields.');
      return;
    }

    alert('Lost item uploaded successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Upload Lost Item</Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name"
        onChangeText={setItemName}
        value={itemName}
      />

      <TextInput
        style={styles.input}
        placeholder="Location Lost"
        onChangeText={setLocationLost}
        value={locationLost}
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Description"
        onChangeText={setDescription}
        value={description}
        multiline
      />

      <TouchableOpacity style={styles.uploadButton} onPress={uploadLostItem}>
        <Text style={styles.buttonText}>Post Lost Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50, // Adjust as needed for status bar
    left: 20,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LostItemUploadScreen;