import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../supabase";
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TransactionPage">;

const TransactionPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#FF4C4C";
      case "pending":
        return "#FFA500";
      default:
        return "#888";
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

    const { data: claimsData, error } = await supabase
      .from("claims")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching claims:", error);
      setLoading(false);
      return;
    }

    const transactionsWithItemNames = await Promise.all(
      (claimsData || []).map(async (claim) => {
        const { data: itemData } = await supabase
          .from("found_items")
          .select("item_name")
          .eq("item_id", claim.item_id)
          .single();

        return {
          ...claim,
          item_name: itemData?.item_name || "Unknown Item",
        };
      })
    );

    setTransactions(transactionsWithItemNames);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [])
  );

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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Your Transactions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : transactions.length === 0 ? (
        <Text style={styles.noTransactions}>No transactions found.</Text>
      ) : (
        <ScrollView>
          {transactions.map((tx) => (
            <TouchableOpacity
              key={tx.claim_id}
              style={styles.transactionCard}
              onPress={() =>
                navigation.navigate("ClaimDetailsScreen", { claim: tx })
              }
            >
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 16, color: "#007AFF" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  noTransactions: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 30 },
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
});

export default TransactionPage;
