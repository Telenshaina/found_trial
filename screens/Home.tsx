import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import QuickActions from './HomeComponents/QuickActions';
import LastAccessed from './HomeComponents/LastAccessed';
import RecentlyUploaded from './HomeComponents/RecentlyUploaded';
import CategorySection from './HomeComponents/CategorySection';
import Header from './Header';

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header showSearch={true}/>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <QuickActions />
          <LastAccessed />
          <RecentlyUploaded />
          <CategorySection title="#Umbrella" />
          <CategorySection title="#Ballpen" />
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
