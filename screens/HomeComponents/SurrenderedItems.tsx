import React, { useEffect, useState } from "react";
import { 
  View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, 
  TouchableOpacity 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  FoundItemDetails: { item: any };
  ListOfAllSurrenderedItems: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FoundItemDetails'>;

type Props = {
  disabled?: boolean;
};

const SurrenderedItems: React.FC<Props> = ({ disabled }) => {
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

  const logLastAccessedItem = async (item: any) => {
    try {
      const itemWithType = { ...item, type: 'found' };
      await AsyncStorage.setItem('lastAccessed', JSON.stringify(itemWithType)); 
      navigation.navigate('FoundItemDetails', { item: itemWithType }); 
    } catch (error) {
      console.error('Error logging last accessed item:', error);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Surrendered Items</Text>
        {items.length >= 6 && (
          <TouchableOpacity 
            onPress={() => navigation.navigate("ListOfAllSurrenderedItems")}
          >
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No surrendered items from Admins yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {items.slice(0, 6).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => logLastAccessedItem(item)} // call the new function
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "600" },
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
  seeMoreText: { fontSize: 10, fontWeight: "bold", color: "#2E7D32" },
});

export default SurrenderedItems;