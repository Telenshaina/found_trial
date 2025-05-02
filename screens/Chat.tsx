import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Header from "./Header";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});


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

  const fetchMessagesForClaim = async (claim_id: string) => {
    const { data: messages, error } = await supabase
      .from("chats")
      .select("*")
      .eq("claim_id", claim_id);

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return messages || [];
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
      .select("*, found_items(item_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  
    if (userClaimsError) {
      console.error("Error fetching user claims:", userClaimsError);
    } else {
      const userClaimsWithMessages = await Promise.all(
        (userClaimsData || []).map(async (claim) => {
          // Fetch messages for each claim
          const messages = await fetchMessagesForClaim(claim.claim_id.toString());
      
          // Fetch item name based on item_id from found_items table
          const { data: foundItemData, error: foundItemError } = await supabase
            .from("found_items")
            .select("item_name")
            .eq("item_id", claim.item_id)
            .single();
      
          const itemName = foundItemData?.item_name || "Unknown Item";
      
          // 👇 NEW: Get the name of the person who found the item (found_by)
          const uploaderName = await getUserName(claim.found_by);
      
          setUserNames((prev) => ({ ...prev, [claim.found_by]: uploaderName }));
      
          if (messages.length > 0) {
            return {
              ...claim,
              item_name: itemName,
              uploader_id: claim.found_by, // 👈 this will be passed to ChatScreen
              messages,
            };
          }
          return null;
        })
      );      
      setUserClaims(userClaimsWithMessages.filter((claim) => claim !== null));
    }
  
    // Handle incoming claims (similar logic)
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
  
      const incomingClaimsWithMessages = await Promise.all(
        (incomingClaimsData || []).map(async (claim) => {
          // Fetch messages for each incoming claim
          const messages = await fetchMessagesForClaim(claim.claim_id.toString());
  
          // Fetch item name from found_items based on item_id
          const { data: foundItemData, error: foundItemError } = await supabase
            .from("found_items")
            .select("item_name")
            .eq("item_id", claim.item_id)
            .single();
  
          if (foundItemError || !foundItemData) {
            console.error("Error fetching item name:", foundItemError);
          }
  
          const itemName = foundItemData ? foundItemData.item_name : "Unknown Item";
  
          const item = itemsUploaded.find((item) => item.item_id === claim.item_id);
          const userName = await getUserName(claim.user_id);
          setUserNames((prevNames) => ({ ...prevNames, [claim.user_id]: userName }));
  
          if (messages.length > 0) {
            return {
              ...claim,
              item_name: itemName, // Add fetched item_name
              messages,
            };
          }
          return null;
        })
      );
  
      setIncomingClaims(incomingClaimsWithMessages.filter((claim) => claim !== null));
    } else {
      setIncomingClaims([]);
    }
  
    setLoading(false);
  };
  

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getUserName = async (userId: string) => {
    let { data: institutionalUser, error: institutionalError } = await supabase
      .from('institutional_users')
      .select('name')
      .eq('id', userId)
      .single();
  
    if (institutionalError || !institutionalUser) {
      const { data: guestUser, error: guestError } = await supabase
        .from('guest_users')
        .select('name')
        .eq('id', userId)
        .single();
  
      if (guestError || !guestUser) {
        return 'N/A';
      }
  
      setUserNames((prevNames) => ({ ...prevNames, [userId]: guestUser.name }));
      return guestUser.name;
    }
  
    setUserNames((prevNames) => ({ ...prevNames, [userId]: institutionalUser.name }));
    return institutionalUser.name;
  };
  
  
  const handleClaimPress = async (claim: any) => {
    // Fetch the user name asynchronously
    const userName = await getUserName(claim.user_id);

    navigation.navigate("ChatScreen", {
      claim_id: claim.claim_id.toString(),
      user_id: params?.user_id,
      uploader_id: claim.uploader_id,
      item_name: claim.item_name || "General", // Fallback to "General" if undefined
    });
  };

  const getCardBackgroundColor = (status: string) => {
    if (!status) return '#FFFFFF';
    switch (status.trim().toLowerCase()) {
      case 'pending':
        return '#FFF3E0'; //yellow  
      case 'approved':
        return '#E8F5E9'; //green 
      default:
        return '#FFFFFF'; //white as def
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.contentWrapper}>
        <Text style={styles.sectionTitle}>Recent Chats</Text>
        <FlatList
          contentContainerStyle={{ paddingBottom: 30 }}
          data={[...userClaims, ...incomingClaims]}
          keyExtractor={(item) => item.claim_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleClaimPress(item)}>
              <View
                style={[
                  styles.transactionItem,
                  { backgroundColor: getCardBackgroundColor(item.status) },
                ]}
              >
                <View style={styles.itemRow}>
                  <Text style={[styles.transactionText, styles.itemName]}>
                    {item.item_name || "No item name available"} {/* Default value if missing */}
                  </Text>
                  <Text style={[styles.transactionText, styles.statusText]}>
                    {item.status || "No status available"} {/* Default value if missing */}
                  </Text>
                </View>
                <Text style={[styles.transactionText, { fontSize: 12 }]}>
                <>
                {userNames[item.user_id] && (
                  <>Claimer Name: {userNames[item.user_id]}<br /></>
                )}
                {userNames[item.found_by] && (
                  <>Founder Name: {userNames[item.found_by]}</>
                )}
              </>

                </Text>
                <Text style={[styles.transactionText, { fontSize: 12 }]}>
  {userNames[item.found_by] ? (
    <>You claimed an item</>
  ) : (
    <>
      {params?.user_id === item.user_id
        ? "You are the claimer"
        : "Wants to claim your item"}
    </>
  )}
</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
  },
  transactionItem: {
    padding: 15,
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
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    flexShrink: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginLeft: 10,
    textTransform: "capitalize",
  },
});

export default Chat;