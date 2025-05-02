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
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
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

    fetchMessages(); //ee

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
      let { error: claimError } = await supabase
        .from("claims")
        .update({ status: "approved" })
        .eq("claim_id", claim_id);

      if (claimError) throw claimError;

      let { data: claimData, error: claimFetchError } = await supabase
        .from("claims")
        .select("item_id")
        .eq("claim_id", claim_id)
        .single();

      if (claimFetchError || !claimData) throw claimFetchError;

      const itemId = claimData.item_id;

      let { error: itemError } = await supabase
        .from("found_items")
        .update({ status: "return_pending" })
        .eq("item_id", itemId);

      if (itemError) throw itemError;

      alert("Claim approved! Proceed with returning the item.");
      setClaimStatus("approved");
    } catch (error: any) {
      console.error("Error approving claim:", error.message);
      alert("Failed to approve claim. Try again.");
    }
  };

  const handleReject = async () => {
    if (!claim_id || !userId) return;
  
    try {
      let { error: claimError } = await supabase
        .from("claims")
        .update({ status: "rejected" })
        .eq("claim_id", claim_id);
  
      if (claimError) throw claimError;
  
      alert("Claim rejected.");
      setClaimStatus("rejected");
    } catch (error: any) {
      console.error("Error rejecting claim:", error.message);
      alert("Failed to reject claim. Try again.");
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
            Selecting <Text style={{ fontWeight: "bold" }}>Approve</Text> will proceed with the returning process, disregarding other claims on this item. 
            Selecting <Text style={{ fontWeight: "bold" }}>Reject</Text> will maintain the item's current status and allow other claims to remain active.{" "}
              <Text style={{ fontWeight: "bold" }}>
                Proceed with caution — this action cannot be undone.
              </Text>
            </Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => setRejectModalVisible(true)}>
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => setModalVisible(true)}>
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
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

      <Modal animationType="slide" transparent={true} visible={rejectModalVisible} onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Rejection</Text>
            <Text style={styles.modalText}>
              Are you sure you want to reject this claim? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setRejectModalVisible(false)}>
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.rejectButton]} 
                onPress={() => {setRejectModalVisible(false); handleReject(); }}>
                <Text style={{ color: "#fff" }}>Reject</Text>
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
  rejectButton: {
    backgroundColor: "red",
    marginRight: 5, // only applies if you don't use `gap`
  },
  approveButton: {
    backgroundColor: "green",
    marginLeft: 5, // only applies if you don't use `gap`
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
    backgroundColor: "#A3A3A3",
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginTop: 10,
    gap: 10, // if gap doesn’t work on your RN version, use marginRight on the first button
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ChatScreen;