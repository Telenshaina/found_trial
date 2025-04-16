import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { supabase } from "../supabase"; // Ensure you import your supabase instance
import Header from "./Header";

const Notification = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
  
      // Get current user
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
        .eq("receiver_id", user.id) // Only get notifications for current user
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
  

  // If loading, show a loading spinner
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

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.notificationItem}>
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.notificationText}>
              {item.message}
            </Text>
            {item.unread && <View style={styles.unreadDot} />}
          </View>
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
