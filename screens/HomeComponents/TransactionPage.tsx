import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../supabase";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TransactionPage">;

const TransactionPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const layout = useWindowDimensions();
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [incomingClaims, setIncomingClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "userClaims", title: "Your Claims" },
    { key: "incomingClaims", title: "Incoming Claims" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "#4CAF50";
      case "rejected": return "#FF4C4C";
      case "pending": return "#FFA500";
      default: return "#888";
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not found:", userError);
      setLoading(false);
      return;
    }

    // Fetch user claims (transactions)
    const { data: userClaimsData, error: userClaimsError } = await supabase
      .from("claims")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Add item names
    const userClaimsWithNames = await Promise.all(
      (userClaimsData || []).map(async (claim) => {
        const { data: itemData } = await supabase
          .from("found_items")
          .select("item_name")
          .eq("item_id", claim.item_id)
          .single();
        return { ...claim, item_name: itemData?.item_name || "Unknown Item" };
      })
    );
    setUserClaims(userClaimsWithNames);

    // Fetch incoming claims (claims on items uploaded by this user)
    const { data: itemsUploadedRaw, error: uploadError } = await supabase
            .from("found_items")
            .select("item_id, item_name")
            .eq("found_by", user.id);

            if (uploadError) {
            console.error("Error fetching uploaded items:", uploadError);
            }
    
    const itemsUploaded = itemsUploadedRaw ?? [];
    const itemIds = itemsUploaded?.map((item) => item.item_id) || [];

    if (itemIds.length > 0) {
      const { data: incomingClaimsData } = await supabase
        .from("claims")
        .select("*")
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      const incomingClaimsWithNames = (incomingClaimsData || []).map((claim) => {
        const item = itemsUploaded.find((item) => item.item_id === claim.item_id);
        return { ...claim, item_name: item?.item_name || "Unknown Item" };
      });
      setIncomingClaims(incomingClaimsWithNames);
    } else {
      setIncomingClaims([]);
    }
    setLoading(false);
  };

  const handleDelete = (claim_id: number) => {
    Alert.alert(
      "Delete Claim",
      "Are you sure you want to delete this claim?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("claims").delete().eq("claim_id", claim_id);
            if (error) {
              Alert.alert("Error", "Failed to delete claim.");
            } else {
              Alert.alert("Deleted", "Claim has been deleted.");
              fetchTransactions();
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const renderUserClaims = () => (
    loading ? <ActivityIndicator size="large" color="#007AFF" /> : userClaims.length === 0 ? (
      <Text style={styles.noTransactions}>No claims found.</Text>
    ) : (
      <ScrollView style={styles.tabContent}>
        {userClaims.map((tx) => (
          <TouchableOpacity key={tx.claim_id} style={styles.transactionCard}
            onPress={() =>
              navigation.navigate("Chat", {
                claim_id: tx.claim_id, 
                user_id: tx.user_id, 
                uploader_id: tx.uploader_id, 
                item_name: tx.item_name,
              })
            }>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.txTitle}>{tx.item_name}</Text>
                <TouchableOpacity onPress={() => handleDelete(tx.claim_id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF4C4C" />
                </TouchableOpacity>
              </View>

              <View style={[styles.statusTag, { backgroundColor: getStatusColor(tx.status) }]}>
                <Text style={styles.statusText}>{tx.status.toUpperCase()}</Text>
              </View>
              <Text>Date: {new Date(tx.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
        ))}
      </ScrollView>
    )
  );

  const renderIncomingClaims = () => (
    loading ? <ActivityIndicator size="large" color="#007AFF" /> : incomingClaims.length === 0 ? (
      <Text style={styles.noTransactions}>No incoming claims found.</Text>
    ) : (
      <ScrollView style={styles.tabContent}>
        {incomingClaims.map((claim) => (
          <TouchableOpacity key={claim.claim_id} style={styles.transactionCard}
            onPress={() =>
              navigation.navigate("ClaimDetailsScreen", { claim: claim, incoming: true })
            }>
              <Text style={styles.txTitle}>{claim.item_name}</Text>
              <View style={[styles.statusTag, { backgroundColor: getStatusColor(claim.status) }]}>
                <Text style={styles.statusText}>{claim.status.toUpperCase()}</Text>
              </View>
              <Text>Claimed by: {claim.user_id}</Text>
              <Text>Date: {new Date(claim.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
        ))}
      </ScrollView>
    )
  );

  const renderScene = SceneMap({
    userClaims: renderUserClaims, 
    incomingClaims: renderIncomingClaims,
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name='arrow-back' size={24} color='black' />
      </TouchableOpacity>
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  noTransactions: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 15 },
  transactionCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  txTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  statusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  tabContent: { padding: 20 },
  tabLabel: { color: "#000", fontWeight: "bold", backgroundColor: "#f9f9f9" },
});

export default TransactionPage;