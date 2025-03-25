import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

const LastAccessed = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [lastAccessed, setLastAccessed] = useState<any | null>(null);

  const fetchLastAccessed = async () => {
    try {
      const savedItem = await AsyncStorage.getItem('lastAccessed');
      if (savedItem) {
        const parsedItem = JSON.parse(savedItem);
        setLastAccessed(parsedItem);
      }

    } catch (error) {
      console.error('Error loading last accessed item:', error);
    }
  };

  useEffect(() => {
    fetchLastAccessed();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLastAccessed();
    }, [])
  );

  const handleNavigation = () => {
    if (!lastAccessed) return;
  
    console.log('Navigating with:', lastAccessed);
  
    if (lastAccessed.type === 'found') {
      navigation.navigate('FoundItemDetails', { item: lastAccessed });
    } else if (lastAccessed.type === 'lost') {
      navigation.navigate('LostItemDetails', { item: lastAccessed });
    } else {
      console.warn('Unknown item type:', lastAccessed.type);
    }
  };
  

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Last Accessed</Text>
      {lastAccessed ? (
        <TouchableOpacity style={styles.card} onPress={handleNavigation}>
          <Image source={{ uri: lastAccessed.image_url }} style={styles.image} />
          <View style={styles.details}>
            <Text style={styles.category}>{lastAccessed.category}</Text>
            <Text style={styles.itemTitle}>{lastAccessed.item_name}</Text>
            <Text style={styles.date}>
              {new Date(lastAccessed.date_found||lastAccessed.date_lost).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noItemsText}>No items accessed recently.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
  },
  details: { flex: 1 },
  category: { fontSize: 12, color: '#666' },
  itemTitle: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: '#666' },
  noItemsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LastAccessed;
