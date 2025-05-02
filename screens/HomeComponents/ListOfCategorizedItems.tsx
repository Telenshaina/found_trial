import React, { useEffect, useState } from "react";
import {
  View,Text,FlatList,Image,TouchableOpacity,ActivityIndicator,StyleSheet,Dimensions,} from "react-native";
import {
  useNavigation,useRoute,RouteProp,} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../navigation/types"; 

// structure
interface Item {
  id: string;
  item_name: string;
  image_url?: string;
  date_lost?: string | null;
  date_found?: string | null;
}

// navigate prop
type NavigationProp = StackNavigationProp<RootStackParamList>;

const ListOfCategorizedItems = () => {
  const navigation = useNavigation<NavigationProp>(); 
  const route =
    useRoute<RouteProp<RootStackParamList, "ListOfCategorizedItems">>();
  const { title } = route.params;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { width } = Dimensions.get("window");
  const numColumns = Math.max(3, Math.floor(width / 180));
  const itemSize = width / numColumns - 16;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const storedItems = await AsyncStorage.getItem("selectedCategory");
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        }
      } catch (error) {
        console.error("Error fetching categorized items:", error);
      }
      setLoading(false);
    };

    fetchItems();
  }, []);

  const handleItemClick = async (item: Item) => {
    try {
      const itemType = item.date_found ? "found" : "lost";

      await AsyncStorage.setItem(
        "lastAccessed",
        JSON.stringify({ ...item, type: itemType })
      );

      if (item.date_lost) {
        navigation.navigate("LostItemDetails", { item });
      } else if (item.date_found) {
        navigation.navigate("FoundItemDetails", { item });
      } else {
        console.error("Error: Item has no date_lost or date_found.");
      }
    } catch (error) {
      console.error("Error saving last accessed item:", error);
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={[styles.card, { width: itemSize }]}
      onPress={() => handleItemClick(item)}
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
        {item.date_lost && (
          <Text style={styles.date}>
            Lost: {new Date(item.date_lost).toLocaleDateString()}
          </Text>
        )}
        {item.date_found && (
          <Text style={styles.date}>
            Found: {new Date(item.date_found).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : items.length === 0 ? (
        <Text style={styles.noItemsText}>No items available in this category.</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          scrollEnabled
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  noItemsText: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 20 },
  list: { flexGrow: 1, justifyContent: "center" },
  card: {
    marginBottom: 12,
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
  imagePlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center", backgroundColor: "#ddd" },
  placeholderText: { fontSize: 14, color: "#555" },
  details: { padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  date: { fontSize: 12, color: "#666" },
});

export default ListOfCategorizedItems;
