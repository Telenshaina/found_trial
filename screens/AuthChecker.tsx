import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../supabase"; 

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AuthChecker = () => {
  const navigation = useNavigation<NavigationProp>();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session check failed:", error);
      }

      if (data?.session) {
        console.log("User already logged in:", data.session.user);
        navigation.replace("Main"); // Redirect to Main if logged in
      } else {
        navigation.replace("Login"); // Redirect to Login if not logged in
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [navigation]);

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return null;
};

export default AuthChecker;
