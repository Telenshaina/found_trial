import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../supabase";
import { Image } from 'react-native';


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
  
    const [foundItemsRes, claimsRes, returnsRes] = await Promise.all([
      supabase.from("found_items").select("*").eq("status", "Claimed"),
      supabase.from("claims").select("*"),
      supabase.from("proof_of_return").select("*"),
    ]);
  
    if (foundItemsRes.error || claimsRes.error || returnsRes.error) {
      console.error("Error fetching data", foundItemsRes.error || claimsRes.error || returnsRes.error);
      setLoading(false);
      return;
    }
  
    const foundItems = foundItemsRes.data || [];
    const claims = claimsRes.data || [];
    const returns = returnsRes.data || [];
  
    const enrichedItems = foundItems.map(item => {
      const claim = claims.find(c => c.item_id === item.item_id); // match item_id
      const returnProof = claim ? returns.find(r => r.claim_id === claim.claim_id) : null;
  
      return {
        ...item,
        claimed_date: returnProof?.date || null, // use proper returnProof field
        claimer_id: claim?.user_id || null,      // needed for filtering "Your Claimed Items"
      };
    });
  
    setClaimedItems(enrichedItems);
    setUserClaimedItems(enrichedItems.filter(item => item.claimer_id === user.id));
    setLoading(false);
  };
  
  useFocusEffect(
    React.useCallback(() => {
      fetchClaimedItems();
    }, [])
  );
  
  const renderClaimCard = (item: any) => (
    <TouchableOpacity
      key={item.item_id}
      style={[
        styles.itemCard,
        { backgroundColor: index === 0 ? "#d5f2cb" : "#FFF3E6" } // Light blue for all claims, light orange for your claims
      ]}
      onPress={() => {
        if (index === 0) {
          navigation.navigate("FoundItemDetails", { item });
        } else {
          navigation.navigate("ClaimDetailsScreen", { claim: item, incoming: false });
        }
      }}
    >
      <View style={styles.cardContent}>
        {/* Left side: text */}
        <View style={styles.cardText}>
          <Text style={[styles.itemTitle, { color: "#333" }]}>{item.item_name}</Text>
          <Text style={{ color: "#666" }}>Status: {item.status}</Text>
          <Text style={{ color: "#666" }}>
            Date Claimed: {item.claimed_date
              ? new Date(item.claimed_date).toLocaleDateString()
              : "N/A"}
          </Text>
        </View>
  
        {/* Right side: image */}
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
      </View>
    </TouchableOpacity>
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
       <Text style={styles.title}>Claimed Items</Text>
      

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
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  cardText: {
    flex: 1,
    paddingRight: 10,
  },
  
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  
  backText: { fontSize: 16, color: "#007AFF" },
  tabContent: { padding: 20 },
  itemCard: { backgroundColor: "#f0f0f0", padding: 15, borderRadius: 10, marginBottom: 10 },
  itemTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  noItemsText: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 15 },
});

export default ClaimedItems;