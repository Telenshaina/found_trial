import React, { useEffect, useState } from "react";
import { 
  View, Text, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../../supabase";

type RootStackParamList = {
  LostItemDetails: { item: any };
  ListOfLostItems: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "LostItemDetails">;

const LostItems = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        // fetch lost items, ordered by most recent date (the output is otherway around)
        const { data: lostItems, error: lostError } = await supabase
          .from("lost_items")
          .select("*")
          .order("date_lost", { ascending: false })
          .limit(8); 

        if (lostError) throw lostError;

        // Fetch guest user IDs
        const foundByIds = lostItems?.map((item) => item.posted_by).filter(Boolean) || [];
        const { data: guestUsers, error: guestError } = await supabase
          .from("guest_users")
          .select("id")
          .in("id", foundByIds);

        if (guestError) console.error("Error fetching guest users:", guestError);

        // Assign user type
        const itemsWithUserType = lostItems.map((item) => ({
          ...item,
          userType: guestUsers?.some((g) => g.id === item.posted_by) ? "Guest" : "User",
        }));

        setItems(itemsWithUserType);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleItemClick = async (item: any) => {
    try {
      const itemWithType = { ...item, type: 'lost' };
      await AsyncStorage.setItem('lastAccessed', JSON.stringify(itemWithType));
      navigation.navigate("LostItemDetails", { item: itemWithType });
    } catch (error) {
      console.error("Error saving last accessed item:", error);
    }
  };

  return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>Lost Items</Text>
          {items.length >= 8 && (
    <TouchableOpacity onPress={() => navigation.navigate("ListOfLostItems")}>
      <Text style={styles.seeMoreText}>See More</Text>
    </TouchableOpacity>
  )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No lost items reported.</Text>
      ) : (
        <FlatList
          data={items.slice(0, 8)} //sliceto only 8 items to display
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleItemClick(item)}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
              <View style={styles.details}>
                {item.userType === "Guest" && <Text style={styles.guestTag}>Posted by Guest</Text>}
                <Text style={styles.itemTitle}>{item.item_name}</Text>
                <Text style={styles.date}>{new Date(item.date_lost).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "600" },
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
  imagePlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center", backgroundColor: "#ddd" },
  placeholderText: { fontSize: 14, color: "#555" },
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
  seeMoreText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
});

export default LostItems;