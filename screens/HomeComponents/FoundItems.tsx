import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  FoundItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FoundItemDetails'>;

interface FoundItemsProps {
  onItemsGrouped?: (groupedItems: Record<string, any[]>) => void; 
}

const FoundItems: React.FC<FoundItemsProps> = ({ onItemsGrouped }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .order('date_found', { ascending: false });
  
      if (error) {
        console.error('Error fetching items:', error);
        setLoading(false);
        return;
      }
  
      const foundByIds = data?.map(item => item.found_by) || [];

  
      const { data: institutionalUsers, error: institutionalError } = await supabase
  .from('institutional_users')
        .select('id, role')
        .in('id', foundByIds);

      if (institutionalError) {
        console.error('Error fetching institutional users:', institutionalError);
      }

      const { data: guestUsers, error: guestError } = await supabase
        .from('guest_users')
        .select('id')
        .in('id', foundByIds);

      if (guestError) {
        console.error('Error fetching guest users:', guestError);
      }

  
        const itemsWithSource = data.map(item => {
          const isInstitutional = institutionalUsers?.find(u => u.id === item.found_by);
          const isGuest = guestUsers?.find(g => g.id === item.found_by);
          return {
            ...item,
            userType: isInstitutional ? 'Institutional' : isGuest ? 'Guest' : 'Unknown',
            role: isInstitutional?.role ?? null,
          };
        });
        
  
      setItems(itemsWithSource);
      
      setLoading(false);
      console.log('Found items:', data);

    };
  
    fetchItems();
  }, []);
  

  useEffect(() => {
    if (onItemsGrouped) {
      const categorizedItems = items.reduce((acc: Record<string, any[]>, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});

      onItemsGrouped(categorizedItems);
    }
  }, [items, onItemsGrouped]);

  const logLastAccessedItem = async (item: any) => {
    const { error } = await supabase.from('last_accessed').insert([
      { 
        item_id: item.id, 
        item_name: item.item_name, 
        category: item.category, 
        image_url: item.image_url, 
        date_found: item.date_found,
        accessed_at: new Date().toISOString() 
      }
    ]);

    if (error) {
      console.error('Error logging last accessed item:', error);
    }

    try {
      await AsyncStorage.setItem('lastAccessed', JSON.stringify(item));
    } catch (storageError) {
      console.error('Error saving last accessed item to AsyncStorage:', storageError);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Found Items</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <Text style={styles.noItemsText}>No recently uploaded items.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
              {items.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.card} 
                  onPress={() => {
                    logLastAccessedItem(item);
                    navigation.navigate('FoundItemDetails', { item });
                  }}
                >
                  <Image source={{ uri: item.image_url }} style={styles.image} />
                  <View style={styles.details}>
                  {item.userType === 'Guest' && (
                    <Text style={styles.guestTag}>Posted by Guest</Text>
                  )}
                  <Text style={styles.itemTitle}>{item.item_name}</Text>
                  <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
                </View>


                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  scrollView: { flexDirection: 'row' },
  card: { width: 180, marginRight: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  image: { width: '100%', height: 120, backgroundColor: '#f1f5f9' },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: '#666' },
  noItemsText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
  guestTag: {
    backgroundColor: '#FFD700',
    color: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  
});

export default FoundItems;
