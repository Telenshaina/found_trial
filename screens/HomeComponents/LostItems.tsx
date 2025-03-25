import React, { useEffect, useState } from "react";
import { 
  View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../../supabase";

type RootStackParamList = {
  ItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "ItemDetails">;

const LostItems = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("lost_items")
        .select("*")
        .order("date_lost", { ascending: false });

      if (error) {
        console.error("Error fetching lost items:", error);
        setLoading(false);
        return;
      }

      const foundByIds = data?.map((item) => item.posted_by).filter(Boolean) || [];

      // fetch guest users who lost items
      const { data: guestUsers, error: guestError } = await supabase
        .from("guest_users")
        .select("id")
        .in("id", foundByIds);

      if (guestError) {
        console.error("Error fetching guest users:", guestError);
      }

      // guest user (idea from foudnitems)
      const itemsWithSource = data.map((item) => {
        const isGuest = guestUsers?.find((g) => g.id === item.posted_by);
        return {
          ...item,
          userType: isGuest ? "Guest" : "Unknown",
        };
      });

      setItems(itemsWithSource);
      setLoading(false);
      console.log("Found items:", itemsWithSource);
    };

    fetchItems();
  }, []);

  const handleItemClick = async (item: any) => {
    try {
      await AsyncStorage.setItem("lastAccessed", JSON.stringify(item));
      console.log("Stored last accessed item:", item);
      navigation.navigate("ItemDetails", { item });
    } catch (error) {
      console.error("Error saving last accessed item:", error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Lost Items</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No lost items reported.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleItemClick(item)}
            >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <View style={styles.details}>
                {item.userType === "Guest" && (
                  <Text style={styles.guestTag}>Guest's Lost Item</Text>
                )}
                <Text style={styles.itemTitle}>{item.item_name}</Text>
                <Text style={styles.date}>{new Date(item.date_lost).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  scrollView: { flexDirection: "row" },
  card: {
    width: 180,
    marginRight: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: { width: "100%", height: 120, backgroundColor: "#f1f5f9" },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  date: { fontSize: 12, color: "#666" },
  noItemsText: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 20 },
  guestTag: {
    backgroundColor: "#FFD700",
    color: "#333",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
});

export default LostItems;
