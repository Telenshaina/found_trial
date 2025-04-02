import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { supabase } from "../supabase"; // Ensure you import your supabase instance
import Header from "./Header";

const Notification = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch notifications when the component is mounted
    const fetchNotifications = async () => {
      setLoading(true);
    
      const { data, error } = await supabase
        .from("notifications")
        .select("*") // You can specify the columns you need, like receiver_id, item_id, sender_id
        .order("created_at", { ascending: false }); // Order by the most recent notifications
    
      if (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
        return;
      }
    
      console.log("Fetched notifications:", data); // Log the fetched data
    
      setNotifications(data); // Update state with the fetched notifications
      setLoading(false); // Set loading to false once data is fetched
    };
    

    fetchNotifications(); // Call the fetch function
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
              {`User ID ${item.sender_id} wants to claim your item: ${item.item_id}`}
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
