import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../supabase";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      console.log("Session:", session);

      if (session?.user?.email?.endsWith("@neu.edu.ph")) {
        const fullName = session.user.user_metadata?.full_name || "Unknown User";

        // ✅ Log the login using full name as user_id
        await logUserActivity(fullName, "login");

        navigation.replace("Main");
      } else if (session) {
        Alert.alert("Unauthorized", "Only institutional accounts can log in on this tab. Try logging in as a guest.");
        supabase.auth.signOut();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Function to log user activity
  const logUserActivity = async (userName: string, activityType: string) => {
    const { error } = await supabase.from("user_logs").insert([
      {
        user_id: userName, // Use full name as the user_id
        activity_type: activityType,
        timestamp: new Date(), // Current timestamp
      },
    ]);

    if (error) {
      console.error("Error inserting log:", error.message);
    } else {
      console.log(`✅ ${activityType} activity recorded for user: ${userName}`);
    }
  };
  
  // 🔹 Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri();

      // Start Google OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;
      console.log("Login initiated. Waiting for session...");
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login Failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.description}>
        Welcome to New Era University’s very own <Text style={{ color: "green" }}>lost & found</Text> app!
      </Text>
      <Text style={styles.subText}>
        FoundNEU is NEU’s official platform for reporting, tracking, and recovering lost items within our community. Whether you’ve lost or found something, our system helps reconnect belongings with their rightful owners efficiently.
      </Text>
      <TouchableOpacity style={styles.signInButton} onPress={handleGoogleSignIn}> 
        <Text style={styles.signInText}>Enter as NEU Member</Text>
      </TouchableOpacity>
    </View>
  );
};

const GuestLogin: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      console.log("Session:", session);

      if (session?.user?.email?.endsWith("@gmail.com")) {
        navigation.replace("Setup");
      } else if (session) {
        Alert.alert("Unauthorized", "Only Gmail accounts can log in as a guest.");
        supabase.auth.signOut();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri();

      // Start Google OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;
      console.log("Login initiated. Waiting for session...");
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login Failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.description}>Hello, dear visitor!</Text>
      <Text style={styles.subText}>Continue as a guest to browse the platform.</Text>
      <TouchableOpacity style={styles.signInButton} onPress={handleGoogleSignIn}> 
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