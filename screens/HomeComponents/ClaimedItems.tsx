import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../supabase";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ClaimedItems">;

const ClaimedItems: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const layout = useWindowDimensions();
  const [claimedItems, setClaimedItems] = useState<any[]>([]);
  const [userClaimedItems, setUserClaimedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const [routes] = useState([
    { key: "allClaims", title: "All Claimed Items" }, 
    { key: "yourClaims", title: "Your Claimed Items" },
  ]);

  const fetchClaimedItems = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User fetch error:", userError);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("found_items")
      .select("*")
      .eq("status", "Claimed");
    
    if (error) {
      console.error("Error fetching claimed items:", error);
    } else {
      setClaimedItems(data || []);
      setUserClaimedItems((data || []).filter(item => item.claimer_id === user.id));
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchClaimedItems();
    }, [])
  );

  const renderClaimCard = (item: any) => (
    <View key={item.id} style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.item_name}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Date Claimed: {new Date(item.claimed_at).toLocaleDateString()}</Text>
    </View>
  );

  const renderAllClaims = () => (
    loading ? <ActivityIndicator size="large" color="#007AFF" /> : claimedItems.length === 0 ? (
      <Text style={styles.noItemsText}>No claimed items found.</Text>
    ) : (
      <ScrollView style={styles.tabContent}>
        {claimedItems.map(renderClaimCard)}
      </ScrollView>
    )
  );

  const renderYourClaims = () => (
    loading ? <ActivityIndicator size="large" color="#007AFF" /> : userClaimedItems.length === 0 ? (
      <Text style={styles.noItemsText}>You haven't claimed any items.</Text>
    ) : (
      <ScrollView style={styles.tabContent}>
        {userClaimedItems.map(renderClaimCard)}
      </ScrollView>
    )
  );

  const renderScene = SceneMap({
    allClaims: renderAllClaims, 
    yourClaims: renderYourClaims,
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name='arrow-back' size={24} color='black' />
      </TouchableOpacity>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene} 
        onIndexChange={setIndex} 
        initialLayout={{ width: layout.width}}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: 'black' }}
            style={{ backgroundColor: 'white' }}
            activeColor="black"
            inactiveColor="gray"
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 16, color: "#007AFF" },
  tabContent: { padding: 20 },
  itemCard: { backgroundColor: "#f0f0f0", padding: 15, borderRadius: 10, marginBottom: 10 },
  itemTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  noItemsText: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 15 },
});

export default ClaimedItems;