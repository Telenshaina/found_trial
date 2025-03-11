import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../../supabase';

// Define Stack Navigation Type
type RootStackParamList = {
  ItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'ItemDetails'>;

const RecentlyUploaded = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>(); // ✅ Correctly type navigation

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .order('date_found', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching items:', error);
      } else {
        console.log("Fetched Items:", data);
        setItems(data || []);
      }
      setLoading(false);
    };

    fetchItems();
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Recently Uploaded</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {items.length === 0 ? (
            <Text style={styles.noItemsText}>No recently uploaded items.</Text>
          ) : (
            items.map((item, index) => (
              <TouchableOpacity 
              key={index} 
              style={styles.card} 
              onPress={() => {
                console.log("Navigating to ItemDetails with:", item);
                navigation.navigate('ItemDetails', { item }); // ✅ Ensure this logs
              }}
            >

                <Image source={{ uri: item.image_url }} style={styles.image} />
                <View style={styles.details}>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.itemTitle}>{item.item_name}</Text>
                  <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  scrollView: { flexDirection: 'row' },
  card: { width: 180, marginRight: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  image: { width: '100%', height: 120, backgroundColor: '#f1f5f9' },
  details: { padding: 8 },
  category: { fontSize: 12, color: '#666' },
  itemTitle: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: '#666' },
  noItemsText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
});

export default RecentlyUploaded;
