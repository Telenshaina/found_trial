import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Header from './Header';

// Define the navigation prop type
type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

const Upload = () => {
  const navigation = useNavigation<UploadScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Select an Option</Text>
        
        <View style={styles.buttonWrapper}>
          <Text style={styles.infoText}>Looking for your item?</Text>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => navigation.navigate('LostItemUploadScreen')}>
            <Text style={styles.primaryButtonText}>Upload Lost Item</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonWrapper}>
          <Text style={styles.infoText}>Found someone else's belonging?</Text>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => navigation.navigate('FoundItemUploadScreen')}>
            <Text style={styles.primaryButtonText}>Upload Found Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    width: '90%',
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default Upload;