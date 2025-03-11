import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import Header from './Header';
import RNPickerSelect from 'react-native-picker-select';
import Home from './Home';

const Upload = () => {
  const navigation = useNavigation();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [dateFound, setDateFound] = useState(new Date());
  const [description, setDescription] = useState('');
  
  const [image, setImage] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
const [tagInput, setTagInput] = useState('');

const handleTagInput = (text: string) => {
  if (text.includes(' ') || text.includes('\n')) {
    let newTag = text.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  } else {
    setTagInput(text);
  }
};

const removeTag = (tagToRemove: string) => {
  setTags(tags.filter(tag => tag !== tagToRemove));
};


  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateFound(selectedDate);
    }
  };

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


  const uploadToSupabase = async () => {
    if (!itemName || !category || !locationFound || !description || !image) {
      alert('Please fill all fields and select an image.');
      return;
    }
  
    try {
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
      
      const { error: dbError } = await supabase.from('lost_items').insert([
        {
          item_name: itemName,
          category,
          location_found: locationFound,
          date_found: dateFound,
          description,
          tags: tags,


          image_url: imageUrl,
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
  

  return (
    <SafeAreaView style={styles.container}>  
      <Header />
      <ScrollView style={styles.main}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>ITEM NAME</Text>
            <TextInput style={styles.input} placeholder="Enter item name" onChangeText={setItemName} value={itemName} />
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
            <TextInput style={styles.input} placeholder="Enter location" onChangeText={setLocationFound} value={locationFound} />
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
            <TextInput style={[styles.input, styles.textarea]} placeholder="Enter description" onChangeText={setDescription} value={description} multiline />
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
              placeholder="Add tags (press space or enter)"
              value={tagInput}
              onChangeText={handleTagInput}
              onSubmitEditing={() => handleTagInput(tagInput + ' ')}
            />
          </View>
        </View>


          <View style={styles.buttonGroup}>
  <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={pickImage}>
    <Text style={styles.outlineButtonText}>Upload Image</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={takePhoto}>
    <MaterialIcons name="camera-alt" size={20} color="black" />
    <Text style={styles.outlineButtonText}>Open Camera</Text>
  </TouchableOpacity>
</View>

{image && <Image source={{ uri: image }} style={{ width: 100, height: 100, alignSelf: 'center' }} />}

<TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={uploadToSupabase}>
  <Text style={styles.primaryButtonText}>Post Item</Text>
</TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
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
    flex: 1,
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
  label: {
    fontSize: 14,
    color: '#666',
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
    flexDirection: 'row',  // Arrange buttons side by side
    gap: 16,               // Add spacing between buttons
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

export default Upload;