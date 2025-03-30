import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
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
    if (!itemName || !category || !locationFound || !description || !image) {
      alert('Please fill all fields and select an image.');
      return;
    }
  
    try {
      // Get authenticated user
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) {
        alert('User not authenticated. Please log in.');
        return;
      }

      const userId = user.user.id; // Extract user ID
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
  
      // Insert found item with authenticated user ID
      const { error: dbError } = await supabase.from('found_items').insert([
        {
          item_name: itemName,
          category,
          location_found: locationFound,
          date_found: dateFound,
          description,
          tags: tags,
          image_url: imageUrl,
          found_by: userId, // Link the found item to the authenticated user
        },
      ]);
  
      if (dbError) {
        console.error('Database error:', dbError);
        alert(`Failed to upload item: ${dbError.message}`);
        return;
      }
  
      alert('Item uploaded successfully!');
      navigation.navigate('Home');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again.');
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

        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={uploadToSupabase}>
          <Text style={styles.primaryButtonText}>Post Found Item</Text>
        </TouchableOpacity>

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
});

export default FoundItemUploadScreen;