import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  ItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'ItemDetails'>;

const SurrenderedItems = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchSurrenderedItems = async () => {
      setLoading(true);
      const { data: foundItems, error: itemsError } = await supabase
        .from("found_items")
        .select("*")
        .order("date_found", { ascending: false });

      if (itemsError) {
        console.error("Error fetching found items:", itemsError);
        setLoading(false);
        return;
      }

      const foundByIds = foundItems.map((item) => item.found_by).filter(id => id);
      const { data: institutionalUsers, error: institutionalError } = await supabase
        .from("institutional_users")
        .select("id, role")
        .in("id", foundByIds);

      if (institutionalError) {
        console.error("Error fetching institutional users:", institutionalError);
        setLoading(false);
        return;
      }

      const surrenderedItems = foundItems
        .map(item => {
          const poster = institutionalUsers?.find(user => user.id === item.found_by);
          return poster && (poster.role === "admin" || poster.role === "superAdmin")
            ? { ...item, role: poster.role }
            : null;
        })
        .filter(item => item !== null);

      setItems(surrenderedItems as any[]);
      setLoading(false);
    };

    fetchSurrenderedItems();
  }, []);

  const handleItemPress = async (item: any) => {
    try {
      await AsyncStorage.setItem("lastAccessed", JSON.stringify(item));
      navigation.navigate("ItemDetails", { item });
    } catch (error) {
      console.error("Error saving last accessed item:", error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Surrendered Items</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No surrendered items from Admins yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleItemPress(item)}
            >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <View style={styles.details}>
                <Text style={styles.itemTitle}>{item.item_name}</Text>
                <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
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
    backgroundColor: "#E6F4EA",
    borderWidth: 2,
    borderColor: "#2E7D32",
    elevation: 3,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  image: { width: "100%", height: 120, backgroundColor: "#f1f5f9" },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  date: { fontSize: 12, color: "#666" },
  noItemsText: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 20 },
});

export default SurrenderedItems;
