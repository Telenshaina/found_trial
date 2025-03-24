import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from "react-native";
import { supabase } from "../../supabase";

const SurrenderedItems = () => {
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAdminItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("found_items")
        .select("*, found_by:users(role)") // join user roles if you have RLS/view or foreign key setup; if not, fetch role separately
        .order("date_found", { ascending: false });

      if (error) {
        console.error("Error fetching surrendered items:", error);
      } else {
        // Filter items where found_by role is admin or super admin
        const filteredItems = data.filter((item: any) =>
          item.found_by?.role === "admin" || item.found_by?.role === "super admin"
        );
        setAdminItems(filteredItems);
      }
      setLoading(false);
    };

    fetchAdminItems();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Surrendered Items</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {adminItems.length === 0 ? (
            <Text>No items surrendered .</Text>
          ) : (
            adminItems.map((item, index) => (
              <View key={index} style={styles.item}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.placeholder}
                />
                <Text style={styles.itemTitle}>{item.item_name}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  item: {
    alignItems: "center",
    marginRight: 12,
  },
  placeholder: {
    width: 120,
    height: 120,
    backgroundColor: "#ddd",
    borderRadius: 8,
  },
  itemTitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#333",
  },
});

export default SurrenderedItems;
