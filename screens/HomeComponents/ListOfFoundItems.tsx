import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, ActivityIndicator, 
  TouchableOpacity, Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../../supabase';

type RootStackParamList = {
  FoundItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FoundItemDetails'>;

const ListOfFoundItems: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  const { width } = Dimensions.get('window'); 
  const numColumns = Math.max(3, Math.floor(width / 180)); //atleast 3 columns if phone 
  const itemSize = width / numColumns - 16; 

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
  
      // Fetch found items
      const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .order('date_found', { ascending: false });
  
      if (error) {
        console.error('Error fetching items:', error);
        setLoading(false);
        return;
      }

      const foundByIds = data.map(item => item.found_by);
  
      // fetch institutional users (if insti (will not display any tags))
      const { data: institutionalUsers, error: institutionalError } = await supabase
        .from('institutional_users')
        .select('id')
        .in('id', foundByIds);
  
      if (institutionalError) console.error('Error fetching institutional users:', institutionalError);
  
      // fetch guest users
      const { data: guestUsers, error: guestError } = await supabase
        .from('guest_users')
        .select('id')
        .in('id', foundByIds);
  
      if (guestError) console.error('Error fetching guest users:', guestError);
  
      // map user type to items to make guesttags
      const enrichedItems = data.map(item => {
        const isInstitutional = institutionalUsers?.some(u => u.id === item.found_by);
        const isGuest = guestUsers?.some(g => g.id === item.found_by);
  
        return {
          ...item,
          userType: isGuest ? 'Guest' : isInstitutional ? 'Institutional' : 'Unknown',
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
      onPress={() => navigation.navigate('FoundItemDetails', { item })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.details}>
        {/* Guest Tag */}
        {item.userType === 'Guest' && (
          <Text style={styles.guestTag}>Posted by Guest</Text>
        )}
        <Text style={styles.itemTitle}>{item.item_name}</Text>
        <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Found Items</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={numColumns} // dynamic column count
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
  list: { flexGrow: 1, justifyContent: 'center' }, // try if it scroll properly (don't have any idea why it is not workin.)
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

export default ListOfFoundItems;
