import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, 
  TouchableOpacity, Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  FoundItemDetails: { item: any };
  ListOfFoundItems: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FoundItemDetails'>;
type Props = {
  disabled?: boolean;
};

const FoundItems: React.FC<Props> = ({ disabled }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('found_items')
          .select('*')
          .order('date_found', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          console.log('No found items retrieved from database.');
          setItems([]);
          setLoading(false);
          return;
        }

        console.log('Fetched found items:', data);

        const foundByIds = data.map(item => item.found_by);
        
        // Fetch institutional users
        const { data: institutionalUsers, error: institutionalError } = await supabase
          .from('institutional_users')
          .select('id, role')
          .in('id', foundByIds);

        if (institutionalError) console.error('Error fetching institutional users:', institutionalError);

        // Fetch guest users
        const { data: guestUsers, error: guestError } = await supabase
          .from('guest_users')
          .select('id')
          .in('id', foundByIds);

        if (guestError) console.error('Error fetching guest users:', guestError);

        const itemsWithSource = data.map(item => {
          const isInstitutional = institutionalUsers?.find(u => u.id === item.found_by);
          const isGuest = guestUsers?.find(g => g.id === item.found_by);

          return {
            ...item,
            userType: isInstitutional ? 'Institutional' : isGuest ? 'Guest' : 'Unknown',
            role: isInstitutional?.role ?? null,
          };
        });

        console.log('Processed items:', itemsWithSource);
        setItems(itemsWithSource);
      } catch (error) {
        console.error('Error fetching items:', error);
        Alert.alert('Error', 'Could not fetch found items.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const logLastAccessedItem = async (item: any) => {
    try {
      const itemWithType = { ...item, type: 'found' };
      await AsyncStorage.setItem('lastAccessed', JSON.stringify(itemWithType)); 
      navigation.navigate('FoundItemDetails', { item: itemWithType });
    } catch (error) {
      console.error('Error logging last accessed item:', error);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Found Items</Text>
        {items.length > 8 && (
          <TouchableOpacity onPress={() => navigation.navigate('ListOfFoundItems')}>
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {items.length === 0 ? (
            <Text style={styles.noItemsText}>No recently uploaded items.</Text>
          ) : (
            items.slice(0, 8).map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.card} 
                onPress={() => logLastAccessedItem(item)}
              >
                {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.image} />
                )}
                <View style={styles.details}>
                  {item.userType === 'Guest' && (
                    <Text style={styles.guestTag}>Posted by Guest</Text>
                  )}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "600" },
  scrollView: { flexDirection: "row" },
  card: { 
    width: 180, marginRight: 16, borderRadius: 8, overflow: "hidden", 
    backgroundColor: "#fff", elevation: 3, shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 
  },
  image: { width: "100%", height: 120, backgroundColor: "#f1f5f9" },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  date: { fontSize: 12, color: "#666" },
  noItemsText: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 20 },
  guestTag: {
    backgroundColor: "#FFD700",
    color: "#333",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  seeMoreText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
});

export default FoundItems;