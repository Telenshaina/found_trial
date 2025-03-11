import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  ItemDetails: { item: any };
};
type NavigationProp = StackNavigationProp<RootStackParamList, 'ItemDetails'>;
const SearchScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'ItemDetails'>>();
  const route = useRoute();
  const { query } = route.params as { query: string };

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 Search query:", query);

    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('lost_items').select('*');

        if (error) throw error;

        const filteredResults = data.filter(item =>
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          item.item_name.toLowerCase().includes(query.toLowerCase()) ||
          (Array.isArray(item.tags) && item.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase())))
        );

        console.log("✅ Fetched items:", filteredResults);
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("❌ Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [query]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Search Results for "{query}"</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : searchResults.length === 0 ? (
        <Text style={styles.noResults}>No results found.</Text>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.resultItem} 
              onPress={() => navigation.navigate('ItemDetails', { item })}
            >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <View style={styles.details}>
                <Text style={styles.resultTitle}>{item.item_name}</Text>
                <Text style={styles.resultCategory}>{item.category}</Text>
                <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 40,
  },
  noResults: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCategory: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
});

export default SearchScreen;
