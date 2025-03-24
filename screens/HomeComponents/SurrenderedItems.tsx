import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from "react-native";
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Surrendered Items</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No surrendered items from Admins yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={() => navigation.navigate("ItemDetails", { item })}
            >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <Text style={styles.itemTitle}>{item.item_name}</Text>
              <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
              
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  item: { alignItems: "center", marginRight: 12, width: 140 },
  image: { width: 120, height: 120, backgroundColor: "#ddd", borderRadius: 8 },
  itemTitle: { marginTop: 4, fontSize: 12, fontWeight: "500", textAlign: "center" },
  date: { fontSize: 10, color: "#666" },
  roleTag: {
    fontSize: 10,
    color: "#fff",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  noItemsText: { fontSize: 14, color: "#777", textAlign: "center" },
});

export default SurrenderedItems;
