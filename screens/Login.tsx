import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../supabase";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

interface RootStackParamList extends Record<string, object | undefined> {
  Login: undefined;
  Main: undefined;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const logUserActivity = async (userId: string, name: string, email: string, activityType: string, userType: string) => {
  const { error } = await supabase.from("user_logs").insert([
    {
      user_id: userId,
      name: name,
      email: email,
      user_type: userType, // "Institutional" or "Guest"
      activity_type: activityType,
      timestamp: new Date(),
    },
  ]);

  if (error) {
    console.error("Error inserting log:", error.message);
  } else {
    console.log(`${activityType} activity recorded for ${userType} user: ${name} (${email})`);
  }
};

const Tab = createMaterialTopTabNavigator();

const Login: React.FC = () => (
  <View style={styles.container}>
    <Image source={require("../assets/neu-logo.png")} style={styles.logo} />
    <Text style={styles.title}>
      <Text style={{ color: "#2E7D32" }}>Found</Text>
      <Text style={{ color: "#FFB902" }}>NEU</Text>
    </Text>
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: "white", elevation: 0, shadowOpacity: 0 },
        tabBarIndicatorStyle: { backgroundColor: "#FFB902" },
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
      if (session?.user?.email?.endsWith("@neu.edu.ph")) {
        const { id: userId, email, user_metadata } = session.user;
        const name = user_metadata.full_name;
  
        // Check if user is banned in institutional_users
        const { data: user, error } = await supabase
          .from("institutional_users")
          .select("status")
          .eq("id", userId)
          .single();
  
        if (error) {
          console.error("Error fetching user status:", error.message);
          return;
        }
  
        if (user?.status === "banned") {
          Alert.alert(
            "You are banned",
            "If you think this is a mistake, please contact an admin."
          );
          await supabase.auth.signOut(); 
          return;
        }
  
        await logUserActivity(userId, name, email, "login", "Institutional");
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
     // const redirectUri = AuthSession.makeRedirectUri();
      const redirectUri = "https://auth.expo.io/@keltnexus/foundneu";

      console.log("Redirect URI:", redirectUri);  // Check the printed URI



      // Step 1: Start OAuth sign-in with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;

      if (data?.url) {
        console.log("[DEBUG] Opening browser session");

        // Step 2: Open the OAuth session in the browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
          { preferEphemeralSession: false }
        );
        
        // Step 3: Check if the result is successful and handle it
        if (result.type === "success" && result.url) {
          // Authentication process is handled automatically, so no need to manually get the session
          console.log('Authentication successful, session will be managed automatically');
        }
      }
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
        Welcome to New Era University’s very
      </Text>
      <Text style={styles.description}>
        own <Text style={{ color: "green" }}>lost & found</Text> app!
      </Text>

      <Text style={styles.subText}>
        FoundNEU is NEU’s official platform for reporting, tracking, and recovering lost items within our community. Whether you’ve lost or found something, our system helps reconnect belongings with their rightful owners efficiently.
      </Text>
      <TouchableOpacity style={styles.signInButton} onPress={handleGoogleSignIn}>
        <Text style={styles.signInText}>Enter as Institutional User</Text>
      </TouchableOpacity>
    </View>
  );
};

const GuestLogin: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userId = session.user.id;
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || "Guest User";
  
        if (!email) {
          console.error("Email is undefined! Check the session object.");
          return;
        }
  
        const userType = email.endsWith("@gmail.com") ? "Guest" : "Institutional";
  
        // Check if user is banned in guest_users
        const { data: user, error } = await supabase
          .from("guest_users")
          .select("status")
          .eq("id", userId)
          .single();
  
        if (error) {
          console.error("Error fetching user status:", error.message);
          return;
        }
  
        if (user?.status === "banned") {
          Alert.alert(
            "You are banned",
            "If you think this is a mistake, please contact an admin."
          );
          await supabase.auth.signOut();
          return;
        }
  
        await logUserActivity(userId, name, email, "login", userType);
        navigation.replace("Setup");
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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login Failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.description}>Hello, Dear Visitor!</Text>
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
  },
  subText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    fontSize: 14,
    color: "#666",
  },
  signInButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
    marginTop: 10,
  },
  signInText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default Login;