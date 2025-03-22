import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import QuickActions from './HomeComponents/QuickActions';
import SurrenderedItems from './HomeComponents/SurrenderedItems';
import LastAccessed from './HomeComponents/LastAccessed';
import FoundItems from './HomeComponents/FoundItems';
import LostItems from './HomeComponents/LostItems';
import CategorySection from './HomeComponents/CategorySection';
import Header from './Header';

const Home = () => {
  const [groupedItems, setGroupedItems] = useState<Record<string, any[]>>({});

  return (
    <SafeAreaView style={styles.container}>
      <Header showSearch={true} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <QuickActions />
          <SurrenderedItems />
          <LastAccessed />
          <FoundItems onItemsGrouped={setGroupedItems} />
          <LostItems />

          {/* Dynamically Render Category Sections */}
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
