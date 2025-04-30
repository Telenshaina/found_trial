import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

// Upload Found Item Form Tab Methods
const FoundItemUploadScreen = () => {
  type NavigationProp = StackNavigationProp<RootStackParamList, 'FoundItemUploadScreen'>;
  const navigation = useNavigation<NavigationProp>();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [dateFound, setDateFound] = useState(new Date());
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Tag management: Add tags using enter only
  const handleTagInput = (text: string) => {
    setTagInput(text); // Update input state normally
  }

  // Tag management: Handles tagSubmit
  const handleTagSubmit = () => {
    let newTag = tagInput.trim(); // Remove extra spaces
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]); // Add tag only if unique & not empty
    }
    setTagInput(''); // Clear input after adding
  };

  // Tag management: Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Function to handle data picker change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateFound(selectedDate);
    }
  };

  // Upload image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Take photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
  
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Upload data to Supabase
  const uploadToSupabase = async () => {
    if (isUploading) {
      console.log('Your found item has already been posted.');
      return;
    }

    if (!itemName || !category || !locationFound || !description || !image) {
      alert('Please fill all fields and select an image.');
      return;
    }

    setIsUploading(true); // Set upload in progress
  
    try {
      // Get authenticated user
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) {
        alert('User not authenticated. Please log in.');
        return;
      }
      const userId = user.user.id; // Extract user ID
      const userEmail = user.user.email || ''; // Extract user email
      // Determine user type based on email
      const userType = userEmail.endsWith('neu.edu.ph') ? 'Institutional' : 'Guest';

      const fileName = `images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const response = await fetch(image);
      const blob = await response.blob();
  
      const { data, error } = await supabase.storage.from('uploads').upload(fileName, blob, {
        contentType: 'image/jpeg', // Ensure correct content type
      });
  
      if (error) {
        console.error('Upload error:', error);
        alert(`Image upload failed: ${error.message}`);
        return;
      }
  
      const imageUrl = supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl;
      console.log('Uploaded Image URL:', imageUrl); // Debugging
  
      // Step 1: Check for duplicate (case-insensitive)
      const { data: existingItems, error: fetchError } = await supabase
        .from('found_items')
        .select('*')
        .eq('found_by', userId);

      if (fetchError) {
        console.error('Error checking for duplicates:', fetchError);
        alert('Something went wrong. Please try again later.');
        setIsUploading(false);
        return;
      }
      
      // Normalize input
      const normalizedItemName = itemName.trim().toLowerCase();
      const normalizedCategory = category.trim().toLowerCase();
      const normalizedLocation = locationFound.trim().toLowerCase();

      // Check duplicates manually
      const isDuplicate = existingItems?.some((item) =>
        item.item_name.toLowerCase() === normalizedItemName &&
        item.category.toLowerCase() === normalizedCategory &&
        item.location_found.toLowerCase() === normalizedLocation
      );

      if (isDuplicate) {
        alert('You have already posted this item.');
        setIsUploading(false);
        return;
      }

      // Step 2: Insert found item
      const { error: dbError } = await supabase.from('found_items').insert([
        {
          item_name: normalizedItemName,
          category: normalizedCategory,
          location_found: normalizedLocation,
          date_found: dateFound,
          description: description.trim(),
          tags: tags.map(tag => tag.trim().toLowerCase()),
          image_url: imageUrl,
          found_by: userId,
        },
      ]);      
  
      if (dbError) {
        console.error('Database error:', dbError);
        alert(`Failed to upload item: ${dbError.message}`);
        setIsUploading(false);
        return;
      }

      // Log the activity in user_logs
      const { error: logError } = await supabase.from('user_logs').insert([
        {
          user_id: userId,
          name: user.user.user_metadata?.full_name || 'Unknown User',
          email: userEmail,
          activity_type: 'Found Item',
          user_type: userType,
          timestamp: new Date(),
        },
      ]);

      if (logError) {
        console.error('Log error:', logError);
      }

      alert('Item uploaded successfully!');
      navigation.navigate('Home');

      } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };
  
  // UI Implementation for Found Items Form
  return (
    <ScrollView style={styles.main}>
      <View style={styles.form}>
        <Text style={styles.title}>✅ Found Item Report ✅</Text>
        <Text style={styles.subtitle}>
          Found an item? Thank you for helping! Please provide 
          details about what you found, including when and where 
          you discovered it. This will help us reunite it with 
          its rightful owner as soon as possible.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ITEM NAME</Text>
          <TextInput style={styles.input} placeholder="Enter item name" placeholderTextColor="#666" 
            onChangeText={setItemName} value={itemName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>CATEGORY</Text>
          <RNPickerSelect 
            onValueChange={(value) => setCategory(value)}
            items={[
              { label: 'Accessory', value: 'Accessory' }, 
              { label: 'Clothes', value: 'Clothes' }, 
              { label: 'Document', value: 'Document' }, 
              { label: 'Electronic', value: 'Electronic' },
              { label: 'Identification Card', value: 'Identification Card' }, 
              { label: 'Money', value: 'Money' }, 
              { label: 'Umbrella', value: 'Umbrella' },
              { label: 'Wallet', value: 'Wallet' },
              { label: 'Others', value: 'Others' },
            ]}
            placeholder={{ label: "Select a category...", value: null }}
            style={pickerSelectStyles} 
            value={category}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>FOUND AT</Text>
          <TextInput style={styles.input} placeholder="Enter location where item was found"
            placeholderTextColor="#666" onChangeText={setLocationFound} value={locationFound}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DATE FOUND</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowPicker(true)}>
            <MaterialIcons name="calendar-today" size={20} color="gray" />
            <Text style={styles.selectText}>{dateFound.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker value={dateFound} mode="date" display="default" onChange={handleDateChange} />
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Describe the item in detail" 
            placeholderTextColor="#666" onChangeText={setDescription} value={description} multiline />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>TAGS</Text>
          <View style={styles.tagContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TextInput 
              style={[styles.input, styles.tagInput]}
              placeholder="Add tags (press enter)"
              value={tagInput} 
              onChangeText={handleTagInput}
              onSubmitEditing={handleTagSubmit}
              blurOnSubmit={false} />
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={pickImage}>
            <MaterialIcons name="upload-file" size={20} color="black" />
            <Text style={styles.outlineButtonText}>Upload Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={takePhoto}>
            <MaterialIcons name="camera-alt" size={20} color="black" />
            <Text style={styles.outlineButtonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>

        {image && <Image source={{ uri: image }} style={{ width: 100, height: 100, alignSelf: 'center' }} />}

        <TouchableOpacity style={[styles.button, styles.primaryButton]}
        onPress={() => setShowConfirmModal(true)} disabled={isUploading}>
          <Text style={styles.primaryButtonText}>Post Found Item</Text>
        </TouchableOpacity>

        {isUploading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Uploading item...</Text>
            </View>
          </View>
        )}

        {showConfirmModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Upload</Text>
              <Text style={styles.modalText}>Are you sure you want to post this found item?</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowConfirmModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.confirmButton]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    uploadToSupabase();
                  }}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '#fff',
  },
  main: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 15, 
    fontWeight: 'normal', 
    fontStyle: 'italic', 
    marginBottom: 16, 
    textAlign: 'center',
    color: '#666',
  },
  label: {
    fontSize: 14,
    color: 'black',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 50,
    backgroundColor: '#fff',
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',  
    gap: 16,         
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  outlineButtonText: {
    fontSize: 16,
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    minWidth: 100,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // make sure it's above everything
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }, 
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },  
});

export default FoundItemUploadScreen;