import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../supabase";

// Define navigation types
type RootStackParamList = {
  Login: undefined;
  Account: undefined;
};

type NavigationProps = StackNavigationProp<RootStackParamList, "Account">;

const Account: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();

  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    studentId: string;
    phoneNumber: string;
  } | null>(null);

  // 🔹 Fetch user details from Supabase
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          throw new Error("User not found");
        }

        const { full_name, student_id, phone_number } = user.user_metadata;

        setUserData({
          name: full_name || "Unknown User",
          email: user.email || "No Email",
          studentId: student_id || "N/A",
          phoneNumber: phone_number || "N/A",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "Failed to load account details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    try {
      // ✅ Fetch the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert("Error", "No user found.");
        return;
      }
  
      const userId = user.id;  
      const { error: logError } = await supabase
        .from("user_logs")  
        .insert([
          {
            user_id: userId, 
            activity_type: "logout",
            timestamp: new Date().toISOString(),
          },
        ]);
  
      if (logError) {
        console.error("Error logging logout:", logError.message);
      } else {
        console.log(`Logout recorded for user: ${userId}`);
      }
  
      await supabase.auth.signOut();
  
      navigation.replace("Login");
  
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Failed", "Something went wrong. Please try again.");
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.accountTitle}>Account</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#d32f2f" style={{ marginTop: 20 }} />
      ) : (
        userData && (
          <>
            <View style={styles.profileContainer}>
              <View style={styles.avatarPlaceholder} />
              <Text style={styles.name}>{userData.name}</Text>
              <Text style={styles.role}>STUDENT</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput style={styles.input} value={userData.email} editable={false} />

              <Text style={styles.label}>STUDENT ID</Text>
              <TextInput style={styles.input} value={userData.studentId} editable={false} />

              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput style={styles.input} value={userData.phoneNumber} editable={false} />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )
      )}
    </SafeAreaView>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginVertical: 10,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#ccc",
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  role: {
    fontSize: 14,
    color: "gray",
  },
  infoContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "gray",
    marginTop: 25,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Account;