import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';


type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

const Upload = () => {
  const navigation = useNavigation<UploadScreenNavigationProp>();  // ✅ Typed correctly

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Option</Text>
      
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Text style={styles.infoText}>Looking for your item?</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('LostItemUploadScreen')}>  
            <Text style={styles.buttonText}>Upload Lost Item</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonWrapper}>
          <Text style={styles.infoText}>Found someone else's belonging?</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('FoundItemUploadScreen')}>  
            <Text style={styles.buttonText}>Upload Found Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>



  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    width: '90%',  
  },
  buttonWrapper: {
    alignItems: 'center',  
    width: '48%',  
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,  
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',  
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Upload;