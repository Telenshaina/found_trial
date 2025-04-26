import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Modal, Alert, SafeAreaView } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import { supabase } from "../../supabase";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "ChatScreen">;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();

  const { uploader_id, item_name, claim_id } = route.params ?? {};

  if (!claim_id) {
    console.error("❌ claim_id is missing! Check navigation.");
    return (
      <View style={styles.container}>
        <Text style={{ color: "red", fontSize: 16 }}>Error: Missing claim_id.</Text>
      </View>
    );
  }

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<any>>(null);
  const isChatDisabled = claimStatus === "approved" || claimStatus === "completed";

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchClaimStatus = async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("status")
        .eq("claim_id", claim_id)
        .single();

      if (!error && data?.status) {
        setClaimStatus(data.status);
      }
    };

    fetchClaimStatus();
  }, [claim_id]);

  const receiverId = uploader_id;

  useEffect(() => {
    const fetchMessages = async () => {
      if (!claim_id) return;
  
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("claim_id", claim_id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error.message);
      } else {
        if (data && data.length > 0) {
          setMessages(data);
        } else {
          console.log("No messages for this claim_id.");
        }
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`chats:claim_id=${claim_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats", filter: `claim_id=eq.${claim_id}` },
        (payload) => {
          setMessages((prevMessages) => {
            const isDuplicate = prevMessages.some((msg) => msg.created_at === payload.new.created_at);
            if (!isDuplicate) {
              return [...prevMessages, payload.new];
            }
            return prevMessages;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [claim_id]);

  const handleSend = async () => {
    if (inputText.trim() === "" || !userId || isChatDisabled) return;

    let finalReceiverId = receiverId;

    if (userId === receiverId) {
      const { data, error } = await supabase
        .from("claims")
        .select("user_id")
        .eq("claim_id", claim_id)
        .single();

      if (error) {
        console.error("Error fetching claim user_id:", error.message);
        return;
      }

      finalReceiverId = data?.user_id ?? receiverId;
    }

    const newMessage = {
      claim_id,
      sender_id: userId,
      receiver_id: finalReceiverId,
      message: inputText,
      created_at: new Date().toISOString(),
    };

    setInputText(""); // Clear input immediately

    const { error } = await supabase.from("chats").insert([newMessage]);

    if (error) {
      console.error("Error sending message:", error.message);
      Alert.alert("Failed to send message. Try again.");
    }
  };

  const handleApprove = async () => {
    if (!claim_id || !userId) return;
  
    try {
      // 1. Update claim to approved
      let { error: claimError } = await supabase
        .from("claims")
        .update({ status: "approved" })
        .eq("claim_id", claim_id);
  
      if (claimError) throw claimError;
  
      // 2. Get item_id and user_id of claimer
      let { data: claimData, error: claimFetchError } = await supabase
        .from("claims")
        .select("item_id, user_id")
        .eq("claim_id", claim_id)
        .single();
  
      if (claimFetchError || !claimData) throw claimFetchError;
  
      const itemId = claimData.item_id;
      const receiverId = claimData.user_id; // the person claiming the item
  
      // 3. Update item status
      let { error: itemError } = await supabase
        .from("found_items")
        .update({ status: "return_pending" })
        .eq("item_id", itemId);
  
      if (itemError) throw itemError;
  
      // 4. Get sender's name from guest_users or institutional_users
      let senderName = "Someone";
  
      const { data: guestData, error: guestError } = await supabase
        .from("guest_users")
        .select("name")
        .eq("id", userId)
        .single();
  
      if (guestData?.name) {
        senderName = guestData.name;
      } else {
        const { data: institutionalData, error: institutionalError } = await supabase
          .from("institutional_users")
          .select("name")
          .eq("id", userId)
          .single();
  
        if (institutionalData?.name) {
          senderName = institutionalData.name;
        }
      }
  
      // 5. Insert notification
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            receiver_id: receiverId,
            sender_id: userId,
            item_id: itemId,
            message: `${senderName} has approved the claim for the item "${item_name}".`,
            read: false,
          },
        ]);
  
      if (notificationError) throw notificationError;
  
      alert("Claim approved! Proceed with returning the item.");
      setClaimStatus("approved");
      setModalVisible(false); // close modal after approval
    } catch (error: any) {
      console.error("Error approving claim or inserting notification:", error.message);
      alert("Failed to approve claim. Try again.");
    }
  };
  

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={24} color='black' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat about {item_name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.chat_id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender_id === userId ? styles.myMessage : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 20 }}
      />
      {!isChatDisabled && (
        <>
          <View style={styles.approvalWarningBox}>
            <Text style={styles.approvalWarningText}>
              Approving the claimer's request will proceed you to the returning process. This will disregard other claims on this item.{" "}
              <Text style={{ fontWeight: "bold" }}>
                Proceed with caution — this action cannot be undone.
              </Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.approveButton} onPress={() => setModalVisible(true)}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Approve Claim</Text>
          </TouchableOpacity>
        </>
      )}

      {isChatDisabled && (
        <Text style={styles.claimNote}>This item has been claimed. Thank you!</Text>
      )}


      {!isChatDisabled && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Type a message..."
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend} // enter button
              blurOnSubmit={false} // keyb funct
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Approval</Text>
            <Text style={styles.modalText}>
              Are you sure you want to approve this claim? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.approveModalButton]} onPress={handleApprove}>
                <Text style={{ color: "#fff" }}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  backButton: { marginRight: 10 },
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
    backgroundColor: "green",
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  claimNote: {
    textAlign: "center",
    color: "gray",
    marginBottom: 10,
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  approveModalButton: {
    backgroundColor: "#34C759",
  },
  approvalWarningBox: {
    backgroundColor: "#FFF5E1",
    borderColor: "#FFA500",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 8,
  },
  approvalWarningText: {
    color: "#7A4E00",
    fontSize: 14,
    lineHeight: 18,
  },
});

export default ChatScreen;