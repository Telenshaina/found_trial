import React, { useEffect, useState } from "react";
import { 
  View, Text, FlatList, StyleSheet, Image, ActivityIndicator, 
  TouchableOpacity 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../../supabase";

type RootStackParamList = {
  FoundItemDetails: { item: any };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FoundItemDetails'>;

const ListOfAllSurrenderedItems: React.FC = () => {
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

      // get the IDs of users who posted the found items
      const foundByIds = foundItems.map((item) => item.found_by).filter(id => id);

      // fetch institutional users (admins and superAdmins)
      const { data: institutionalUsers, error: institutionalError } = await supabase
        .from("institutional_users")
        .select("id, role")
        .in("id", foundByIds);

      if (institutionalError) {
        console.error("Error fetching institutional users:", institutionalError);
        setLoading(false);
        return;
      }

      // filter posted from admin and superadmin
      const surrenderedItems = foundItems
        .map(item => {
          const poster = institutionalUsers?.find(user => user.id === item.found_by);
          // check if admin/superadmin (poster)
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("FoundItemDetails", { item })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.details}>
        <Text style={styles.itemTitle}>{item.item_name}</Text>
        <Text style={styles.date}>{new Date(item.date_found).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Surrendered Items</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No surrendered items from Admins yet.</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}  // Display items in 2 columns
          contentContainerStyle={styles.list}
          scrollEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  noItemsText: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 20 },
  list: { flexGrow: 1, justifyContent: "center" },
  card: {
    flex: 1,  
    margin: 8,  
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 10,
  },
  image: { width: "100%", height: 120, backgroundColor: "#f1f5f9", borderRadius: 8 },
  imagePlaceholder: { 
    width: "100%", 
    height: 120, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#ddd" 
  },
  placeholderText: { fontSize: 14, color: "#555" },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  date: { fontSize: 12, color: "#666" },
});

export default ListOfAllSurrenderedItems;
