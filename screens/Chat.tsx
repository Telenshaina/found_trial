import React from "react";
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, TouchableOpacity } from "react-native";
import Header from './Header';
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

const contacts = [
  {
    id: "1",
    name: "Shaina Blessy Meir Telen",
    email: "shainablessymeir.telen@neu.edu.ph",
    image: require("../assets/shaina.jpg"),
  },
  {
    id: "2",
    name: "Faye Camille Buri",
    email: "fayecamille.buri@neu.edu.ph",
    image: require("../assets/faye.png"),
  },
  {
    id: "3",
    name: "Venus Ruselle Daanoy",
    email: "venusruselle.daanoy@neu.edu.ph",
    image: require("../assets/venus.jpg"),
  },
  {
    id: "4",
    name: "John Keith Mercado",
    email: "johnkeith.mercado@neu.edu.ph",
    image: require("../assets/john.png"),
  },
  {
    id: "5",
    name: "Louise Andrea Tatoy",
    email: "louiseandrea.tatoy@neu.edu.ph",
    image: require("../assets/louise.jpg"),
  },
];

type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList, "ChatScreen">;

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation<ChatNavigationProp>();

  // Check if user navigated with uploader_id and item_name
  const params: any = route.params;
  const uploaderContact = contacts.find((c) => c.id === params?.uploader_id);

  const chatContacts = uploaderContact ? [uploaderContact] : contacts;const handleContactPress = (contact: any) => {
    navigation.navigate("ChatScreen", {
      claim_id: params?.claim_id, // Ensure claim_id is passed
      user_id: params?.user_id, // Ensure user_id is passed
      uploader_id: contact.id, // Contact ID becomes the uploader ID
      item_name: params?.item_name ?? "General",
    });
  };
  
  

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {uploaderContact ? `Chat with ${uploaderContact.name}` : "Contacts"}
          </Text>
          <FlatList
            data={chatContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleContactPress(item)}
              >
                <Image source={item.image} style={styles.avatar} />
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    color: "#777",
  },
});

export default Chat;