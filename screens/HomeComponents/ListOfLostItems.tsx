import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, ActivityIndicator, 
  TouchableOpacity, Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../../supabase';

type RootStackParamList = {
  LostItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'LostItemDetails'>;

const ListOfLostItems: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  const { width } = Dimensions.get('window'); 
  const numColumns = Math.max(3, Math.floor(width / 180)); 
  const itemSize = width / numColumns - 16; 

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
  
      // Fetch lost items
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .order('date_lost', { ascending: false });
  
      if (error) {
        console.error('Error fetching lost items:', error);
        setLoading(false);
        return;
      }
  
      const lostByIds = data.map(item => item.posted_by);
  
      // Fetch guest users who lost items
      const { data: guestUsers, error: guestError } = await supabase
        .from('guest_users')
        .select('id')
        .in('id', lostByIds);
  
      if (guestError) console.error('Error fetching guest users:', guestError);
  
      // Map user type to items
      const enrichedItems = data.map(item => {
        const isGuest = guestUsers?.some(g => g.id === item.posted_by);
        return {
          ...item,
          userType: isGuest ? 'Guest' : 'Unknown',
        };
      });
  
      setItems(enrichedItems);
      setLoading(false);
    };
  
    fetchItems();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { width: itemSize }]}
      onPress={() => navigation.navigate('LostItemDetails', { item })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.details}>
        {item.userType === 'Guest' && (
          <Text style={styles.guestTag}>Posted by Guest</Text>
        )}
        <Text style={styles.itemTitle}>{item.item_name}</Text>
        <Text style={styles.date}>{new Date(item.date_lost).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Lost Items</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          scrollEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  list: { flexGrow: 1, justifyContent: 'center' },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 10,
  },
  image: { width: '100%', height: 120, backgroundColor: '#f1f5f9', borderRadius: 8 },
  imagePlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' },
  placeholderText: { fontSize: 14, color: '#555' },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: '#666' },
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

export default ListOfLostItems;
