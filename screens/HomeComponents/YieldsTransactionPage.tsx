import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

const YieldsTransactionPage: React.FC = () => {
  const layout = useWindowDimensions();
  const navigation = useNavigation();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "lostItems", title: "Your Lost Items" },
    { key: "incomingYields", title: "Incoming Yields" },
    { key: "yourYields", title: "Your Yields" },
  ]);

  const renderLostItems = () => (
    <View style={styles.blankContainer}>
      <Text style={styles.blankText}>No lost items yet.</Text>
    </View>
  );

  const renderIncomingYields = () => (
    <View style={styles.blankContainer}>
      <Text style={styles.blankText}>No incoming yield claims yet.</Text>
    </View>
  );

  const renderYourYields = () => (
    <View style={styles.blankContainer}>
      <Text style={styles.blankText}>You have no yield claims yet.</Text>
    </View>
  );

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

  blankContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blankText: {
    fontSize: 16,
    color: "#888",
  },
});

export default YieldsTransactionPage;
