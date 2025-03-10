import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

interface RootStackParamList extends Record<string, object | undefined> {
  Login: undefined;
  Main: undefined;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const Tab = createMaterialTopTabNavigator();

const Login: React.FC = () => (
  <View style={styles.container}>
    <Image source={require("../assets/neu-logo.png")} style={styles.logo} />
    <Text style={styles.title}>
      Found<Text style={{ color: "green" }}>NEU</Text>
    </Text>
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: "white", elevation: 0, shadowOpacity: 0 },
        tabBarIndicatorStyle: { backgroundColor: "#d32f2f" },
        tabBarLabelStyle: { fontWeight: "bold", textTransform: "none" },
      }}
    >
      <Tab.Screen name="Institutional" component={InstitutionalLogin} />
      <Tab.Screen name="Guest" component={GuestLogin} />
    </Tab.Navigator>
  </View>
);

const InstitutionalLogin: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.description}>
        Welcome to New Era University’s very own <Text style={{ color: "green" }}>lost & found</Text> app!
      </Text>
      <Text style={styles.subText}>
        FoundNEU is NEU’s official platform for reporting, tracking, and recovering lost items within our community. Whether you’ve lost or found something, our system helps reconnect belongings with their rightful owners efficiently.
      </Text>
      <TouchableOpacity style={styles.signInButton} onPress={() => navigation.replace("Main")}> 
        <Text style={styles.signInText}>Enter as NEU Member</Text>
      </TouchableOpacity>
    </View>
  );
};

const GuestLogin: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  return (
    <View style={styles.loginContainer}>
      <Text style={styles.description}>Hello, dear visitor!</Text>
      <Text style={styles.subText}>Continue as a guest to browse the platform.</Text>
      <TouchableOpacity style={styles.signInButton} onPress={() => navigation.replace("Main")}> 
        <Text style={styles.signInText}>Enter as Guest</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#d32f2f",
  },
  loginContainer: {
    padding: 20,
    alignItems: "center",
  },
  description: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    color: "#666",
  },
  signInButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },
  signInText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Login;
