import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { supabase } from "../../supabase"; // adjust path if needed
import { Session } from "@supabase/supabase-js";
import { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from '@react-navigation/stack';

const YieldsTransactionPage: React.FC = () => {
  const layout = useWindowDimensions();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "lostItems", title: "Your Lost Items" },
    { key: "incomingYields", title: "Incoming Yields" },
    { key: "yourYields", title: "Your Yields" },
  ]);

  const [lostItems, setLostItems] = useState<any[]>([]);
  const [yourYields, setYourYields] = useState<any[]>([]); // state for yields
  const [incomingYields, setIncomingYields] = useState<any[]>([]); // state for incoming yields
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log("Error fetching session:", error.message);
      } else {
        setSession(data.session);
      }
    };
    fetchSession();
  }, []);

  // fetch lost items
  useEffect(() => {
    if (session) {
      fetchLostItems();
    }
  }, [session]);

  // your yields or reported by user
  useEffect(() => {
    if (session) {
      fetchYourYields();
    }
  }, [session]);

  // incoming yields (to > lsotItem)
  useEffect(() => {
    if (session) {
      fetchIncomingYields();
    }
  }, [lostItems]);

  const fetchLostItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("lost_items")
        .select("*")
        .eq("posted_by", session?.user.id);

      if (error) {
        console.error("Error fetching lost items:", error.message);
      } else {
        setLostItems(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYourYields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("yields")
        .select("*")
        .eq("user_id", session?.user.id);

      if (error) {
        console.error("Error fetching yields:", error.message);
      } else {
        setYourYields(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  // fetch incoming yields based on lost items (claims on the current user's lost items)
  const fetchIncomingYields = async () => {
    try {
      setLoading(true);
      const itemIds = lostItems.map((item) => item.item_id);

      if (itemIds.length > 0) {
        const { data, error } = await supabase
          .from("yields")
          .select("*")
          .in("item_id", itemIds) // find yields for lost items posted by the current user by ITEM ID
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching incoming yields:", error.message);
        } else {
          setIncomingYields(data || []);
        }
      } else {
        setIncomingYields([]);
      }
    } catch (error) {
      console.error("Unexpected error fetching incoming yields:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderLostItems = () => (
    <View style={styles.tabContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : lostItems.length === 0 ? (
        <View style={styles.blankContainer}>
          <Text style={styles.blankText}>No lost items yet.</Text>
        </View>
      ) : (
        <FlatList
          data={lostItems}
          keyExtractor={(item) => item.item_id.toString()}
          contentContainerStyle={styles.cardListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
            style={styles.itemCard}
            onPress={() => navigation.navigate('LostItemDetails', { item })}
          >
              
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );


  const renderIncomingYields = () => (
    <View style={styles.tabContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : incomingYields.length === 0 ? (
        <View style={styles.blankContainer}>
          <Text style={styles.blankText}>No incoming yield claims yet.</Text>
        </View>
      ) : (
        <FlatList
          data={incomingYields}
          keyExtractor={(item) => item.yield_id.toString()}
          contentContainerStyle={styles.cardListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => handleYieldPress(item)}
            >
              {item.proof_url && (
                <Image source={{ uri: item.proof_url }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Claim #{item.yield_id}</Text>
                <Text
                  style={[styles.itemCategory, { color: getStatusColor(item.status) }]}
                >
                  Status: {item.status}
                </Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderYourYields = () => (
    <View style={styles.tabContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : yourYields.length === 0 ? (
        <View style={styles.blankContainer}>
          <Text style={styles.blankText}>You have no yield claims yet.</Text>
        </View>
      ) : (
        <FlatList
          data={yourYields}
          keyExtractor={(item) => item.yield_id.toString()}
          contentContainerStyle={styles.cardListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => handleYieldPress(item)}
            >
              {item.proof_url && (
                <Image source={{ uri: item.proof_url }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Claim #{item.yield_id}</Text>
                <Text
                  style={[styles.itemCategory, { color: getStatusColor(item.status) }]}
                >
                  Status: {item.status}
                </Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

const handleItemPress = (item: any) => {
  // here you can add a direct transition to another page
  //navigation.navigate(); '' <- desired page
};

const handleYieldPress = (item: any) => {
};

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#4CAF50"; // green
      case "rejected":
        return "#FF4C4C"; // red
      case "pending":
        return "#FFA500"; // yellow
      default:
        return "#888"; // gray (this is for text only (currently))
    }
  };

  const renderScene = SceneMap({
    lostItems: renderLostItems,
    incomingYields: renderIncomingYields,
    yourYields: renderYourYields,
  });

  const renderDescription = () => {
    if (index === 0) {
      return (
        <View style={styles.descriptionContainer}>
          <Text style={styles.boldText}>Lost something?</Text>
          <Text style={styles.descriptionText}>
            This section shows all your reported lost items. Track their status and wait for someone to find them!
          </Text>
        </View>
      );
    } else if (index === 1) {
      return (
        <View style={styles.descriptionContainer}>
          <Text style={styles.boldText}>Someone found your lost item!</Text>
          <Text style={styles.descriptionText}>
            Review the claims here and get ready to reunite with your belongings.
          </Text>
        </View>
      );
    } else if (index === 2) {
      return (
        <View style={styles.descriptionContainer}>
          <Text style={styles.boldText}>You’ve found something!</Text>
          <Text style={styles.descriptionText}>
            Here are the items you’ve discovered and reported. Help others by returning what they’ve lost!
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Lost Items Center</Text>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <View>
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: "black" }}
              style={{ backgroundColor: "white" }}
              activeColor="black"
              inactiveColor="gray"
            />
            {/* Description inside the TabBar, below the tabs */}
            <View style={styles.descriptionContainer}>
              {renderDescription()}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: "#fff" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
  },
  descriptionContainer: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  tabContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  blankContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blankText: {
    fontSize: 16,
    color: "#777",
  },
  cardListContainer: {
    paddingTop: 10,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemCategory: {
    fontSize: 14,
    color: "#777",
  },
  itemDescription: {
    fontSize: 12,
    color: "#555",
  },
});

export default YieldsTransactionPage;