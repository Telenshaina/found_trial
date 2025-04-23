import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../supabase"; // Ensure you import your supabase instance
import Header from "./Header";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NotificationNavigationProp = NativeStackNavigationProp<RootStackParamList, "Notification">;

const Notification = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigation = useNavigation<NotificationNavigationProp>();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching current user:", userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
        return;
      }

      setNotifications(data);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const handleNotificationPress = async (notification: any) => {
    const { item_id, receiver_id, sender_id } = notification;

    // Update the notification to mark it as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notification.id);

    if (error) {
      console.error("Error updating notification:", error);
    }

    // Navigate to claim details
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("*")
      .eq("item_id", item_id)
      .eq("found_by", receiver_id)
      .eq("user_id", sender_id)
      .limit(1)
      .single();

    if (claimError || !claim) {
      Alert.alert("Claim not found", "Unable to find the claim details.");
      console.error("Claim fetch error:", claimError);
      return;
    }

    navigation.navigate("ClaimDetailsScreen", {
      claim,
      incoming: true,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <Text style={styles.notificationsTitle}>Loading Notifications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Text style={styles.notificationsTitle}>Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleNotificationPress(item)}>
            <View style={styles.notificationItem}>
              <View style={styles.avatarPlaceholder} />
              <Text style={[styles.notificationText, item.read && styles.readText]}>
                {item.message}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  notificationsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginVertical: 10,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: "#ccc",
    borderRadius: 20,
    marginRight: 10,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "bold", // Bold text for unread notifications
  },
  readText: {
    fontWeight: "normal", // Normal text for read notifications
    color: "#666", // Optional: You can change the color of the read notifications
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: "red",
    borderRadius: 4,
    marginLeft: 8,
  },
});

export default Notification;