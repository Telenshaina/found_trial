import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../supabase";

const ClaimedItems: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "ClaimedItems">>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("allClaims");
  const [claimedItems, setClaimedItems] = useState<any[]>([]);

  const fetchClaimedItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("found_items")
      .select("*")
      .eq("status", "Claimed");
    
    if (error) {
      console.error("Error fetching claimed items:", error);
    } else {
      setClaimedItems(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchClaimedItems();
    }, [])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      <View style={styles.tabsContainer}>
      <TouchableOpacity
          style={[styles.tab, activeTab === "allClaims" && styles.activeTab]}
          onPress={() => setActiveTab("allClaims")}
        >
          <Text style={styles.tabText}>All Claimed Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "yourClaims" && styles.activeTab]}
          onPress={() => setActiveTab("yourClaims")}
        >
          <Text style={styles.tabText}>Your Claimed Items</Text>
        </TouchableOpacity>
        
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <ScrollView>
          {activeTab === "allClaims" && claimedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.item_name}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Date Claimed: {new Date(item.claimed_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 16, color: "#007AFF" },
  tabsContainer: { flexDirection: "row", marginBottom: 10 },
  tab: { flex: 1, padding: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#ccc" },
  activeTab: { borderBottomColor: "#007AFF" },
  tabText: { fontSize: 16, fontWeight: "bold" },
  itemCard: { backgroundColor: "#f0f0f0", padding: 15, borderRadius: 10, marginBottom: 10 },
  itemTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 }
});

export default ClaimedItems;
