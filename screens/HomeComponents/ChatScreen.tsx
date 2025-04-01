import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { RootStackParamList } from "../../navigation/types";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "ChatScreen">;

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ChatScreenRouteProp>();
  const [claimId, setClaimId] = useState<string | null>(route.params.claim_id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const { claim_id, uploader_id, user_id, item_name } = route.params as {
    claim_id: string;
    uploader_id: string;
    user_id: string;
    item_name: string;
  };
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!claimId) return;
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: true });

      if (error) console.error("Error fetching messages:", error);
      else setMessages(data || []);
    };

    fetchMessages();

    const subscription = supabase
      .channel("chats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, (payload) => {
        const newMessage: ChatMessage = {
          id: payload.new.id,
          sender_id: payload.new.sender_id,
          receiver_id: payload.new.receiver_id,
          message: payload.new.message,
          created_at: payload.new.created_at,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [claimId]);

  const handleSend = async () => {
    if (!claimId || inputText.trim() === "") return;

    const newMessage = {
      claim_id: claimId,
      sender_id: user_id,
      receiver_id: uploader_id,
      message: inputText,
    };
    

    const { error } = await supabase.from("chats").insert(newMessage);

    if (error) console.error("Error sending message:", error);
    else setInputText("");
  };

  const approveClaim = async () => {
    Alert.alert(
      "Confirm Approval", 
      "Do you approve the claim?", 
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: async () => {
            if (!claimId) return;
            const { error } = await supabase
              .from("claims")
              .update({ status: "approved" }) // Update claim status
              .eq("id", claimId);
  
            if (error) {
              console.error("Error approving claim:", error);
              Alert.alert("Error", "Something went wrong. Please try again.");
            } else {
              Alert.alert("Success", "Claim approved successfully!");
            }
          },
        },
      ]
    );
  };
  

  return (
    <View style={styles.container}>
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Chat about {item_name}</Text>
  </View>

  <FlatList
    data={messages}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View
        style={[
          styles.messageBubble,
          item.sender_id === user_id ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    )}
    contentContainerStyle={{ paddingVertical: 20 }}
  />

  {/* Approve Button */}
  <TouchableOpacity style={styles.approveButton} onPress={approveClaim}>
    <Text style={styles.approveButtonText}>Approve Claim</Text>
  </TouchableOpacity>

  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
    <View style={styles.inputContainer}>
      <TextInput
        placeholder="Type a message..."
        style={styles.textInput}
        value={inputText}
        onChangeText={setInputText}
      />
      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
</View>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backText: { fontSize: 16, color: "#007AFF", marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#000",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 8,
    justifyContent: "center",
  },
  approveButton: {
    backgroundColor: "#28a745", // Green color
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    margin: 10,
  },
  
  approveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  
});

export default ChatScreen;
