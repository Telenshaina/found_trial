import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

interface CategorySectionProps {
  title: string;
  items: any[];
}

const CategorySection = ({ title, items }: CategorySectionProps) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {items.length === 0 ? (
          <Text style={styles.noItemsText}>No items found in this category.</Text>
        ) : (
          items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={async () => {
                  console.log("Navigating to ItemDetails with:", item);
                  try {
                    await AsyncStorage.setItem('lastAccessed', JSON.stringify(item));
                  } catch (error) {
                    console.error("Error saving last accessed item:", error);
                  }
                  navigation.navigate('ItemDetails', { item });
                }}
              >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <View style={styles.details}>
                <Text style={styles.itemTitle}>{item.item_name}</Text>
                <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  scrollView: { flexDirection: 'row' },
  card: { width: 180, marginRight: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  image: { width: '100%', height: 120, backgroundColor: '#f1f5f9' },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, color: '#666' },
  noItemsText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
});

export default CategorySection;
