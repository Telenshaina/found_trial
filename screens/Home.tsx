import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import QuickActions from './HomeComponents/QuickActions';
import SurrenderedItems from './HomeComponents/SurrenderedItems';
import LastAccessed from './HomeComponents/LastAccessed';
import FoundItems from './HomeComponents/FoundItems';
import LostItems from './HomeComponents/LostItems';
import CategorySection from './HomeComponents/CategorySection';
import Header from './Header';
import { supabase } from '../supabase';

const Home = () => {
  const [groupedItems, setGroupedItems] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        // Fetch both found and lost items
        const { data: foundItems, error: foundError } = await supabase.from('found_items').select('*');
        const { data: lostItems, error: lostError } = await supabase.from('lost_items').select('*');

        if (foundError) console.error('Error fetching found items:', foundError);
        if (lostError) console.error('Error fetching lost items:', lostError);

        // Combine the two datasets
        const allItems = [...(foundItems || []), ...(lostItems || [])];

        // Group items by category
        const grouped: Record<string, any[]> = {};
        allItems.forEach((item) => {
          const category = item.category || 'Uncategorized';
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(item);
        });

        setGroupedItems(grouped);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    fetchAllItems();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header showSearch={true} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <QuickActions />
          <SurrenderedItems />
          <LastAccessed />
          <FoundItems />
          <LostItems />

          {/* Render categorized items (both found and lost together) */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <CategorySection key={category} title={`#${category}`} items={items} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 24 },
});

export default Home;
