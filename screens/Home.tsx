import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import QuickActions from './HomeComponents/QuickActions';
import SurrenderedItems from './HomeComponents/SurrenderedItems';
import LastAccessed from './HomeComponents/LastAccessed';
import FoundItems from './HomeComponents/FoundItems';
import LostItems from './HomeComponents/LostItems';
import CategorySection from './HomeComponents/CategorySection';
import Header from './Header';
import CompleteProfileModal from "./CompleteProfileModal";
import { supabase } from '../supabase';

const Home = () => {
  const [groupedItems, setGroupedItems] = useState<Record<string, any[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);


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

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
  
      if (!session) return;
  
      const { user } = session;
      const userId = user.id;
      const email = user.email;
  
      const isInstitutional = email?.endsWith("@neu.edu.ph");
      const table = isInstitutional ? "institutional_users" : "guest_users";
  
      const { data: userData, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", userId)
        .single();
  
      if (error) {
        console.error("Error fetching profile:", error.message);
        return;
      }
  
      const missingDetails =
        !userData.phone_number || (isInstitutional && !userData.student_id);
  
      if (missingDetails) {
        setShowModal(true);
        setProfileIncomplete(true); 
      } else {
        setProfileIncomplete(false);
      }
    };
  
    checkProfileCompleteness();
  }, []);
  

  return (
    <SafeAreaView style={styles.container}>
      <Header showSearch={true} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        <QuickActions disabled={profileIncomplete} />
        <SurrenderedItems disabled={profileIncomplete} />
        <LastAccessed disabled={profileIncomplete} />
        <FoundItems disabled={profileIncomplete} />
        <LostItems disabled={profileIncomplete} />


      <CompleteProfileModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        userType="institutional" // or "guest", or dynamically determine it
      />
      

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
