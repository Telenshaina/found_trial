import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, TouchableOpacity, ActivityIndicator } from "react-native";
import Header from './Header';
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../supabase";

const contacts = [
  { id: "1", name: "Shaina Blessy Meir Telen", email: "shainablessymeir.telen@neu.edu.ph", image: require("../assets/shaina.jpg") },
  { id: "2", name: "Faye Camille Buri", email: "fayecamille.buri@neu.edu.ph", image: require("../assets/faye.png") },
  { id: "3", name: "Venus Ruselle Daanoy", email: "venusruselle.daanoy@neu.edu.ph", image: require("../assets/venus.jpg") },
  { id: "4", name: "John Keith Mercado", email: "johnkeith.mercado@neu.edu.ph", image: require("../assets/john.png") },
  { id: "5", name: "Louise Andrea Tatoy", email: "louiseandrea.tatoy@neu.edu.ph", image: require("../assets/louise.jpg") },
];

type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList, "ChatScreen">;

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation<ChatNavigationProp>();

  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [incomingClaims, setIncomingClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const params: any = route.params;
  const uploaderContact = contacts.find((c) => c.id === params?.uploader_id);

  const chatContacts = uploaderContact ? [uploaderContact] : contacts;

  const handleContactPress = (contact: any) => {
    navigation.navigate("ChatScreen", {
      claim_id: params?.claim_id,
      user_id: params?.user_id,
      uploader_id: contact.id,
      item_name: params?.item_name ?? "General",
    });

    const newChat = {
      id: contact.id,
      name: contact.name,
      lastMessage: "Hi, how can I help?",
      timestamp: new Date().toISOString(),
      image: contact.image,
    };

    setRecentChats((prevChats) => [newChat, ...prevChats]);
  };

  const fetchTransactions = async () => {
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not found:", userError);
      setLoading(false);
      return;
    }

    const { data: userClaimsData, error: userClaimsError } = await supabase
      .from("claims")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userClaimsError) {
      console.error("Error fetching user claims:", userClaimsError);
    } else {
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
    }

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleClaimPress = (claim: any) => {
    navigation.navigate("ChatScreen", {
      claim_id: claim.claim_id.toString(),  // Ensure it's a string if required
      user_id: params?.user_id,  // Assuming user_id comes from route params or some state
      uploader_id: claim.uploader_id,  // Assuming uploader_id is part of the claim data
      item_name: claim.item_name,  // Passing item name as well
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Chats</Text>
          <FlatList
            data={[...userClaims, ...incomingClaims]} // Combine both claims into one list
            keyExtractor={(item) => item.claim_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleClaimPress(item)}>
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionText}>Claim ID: {item.claim_id}</Text>
                  <Text style={styles.transactionText}>Item: {item.item_name}</Text>
                  <Text style={styles.transactionText}>Status: {item.status}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#000000",
  },
  card: {
    marginBottom: 20,
  },
  transactionItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  transactionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
});

export default Chat;