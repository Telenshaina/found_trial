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

  // New state variables for editable fields
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // 🔹 Fetch user details from Supabase
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
  
        if (error || !user) {
          throw new Error("User not found");
        }
  
        // Extract email domain
        const emailDomain = user.email?.split("@")[1] || "";
        const table = emailDomain === "neu.edu.ph" ? "institutional_users" : "guest_users";
  
        // Fetch user details from the appropriate table
        const { data: userDetails, error: userDetailsError } = await supabase
          .from(table)
          .select("name, student_id, phone_number")
          .eq("id", user.id)
          .single();
  
        if (userDetailsError || !userDetails) {
          throw new Error(`User details not found in ${table}`);
        }
  
        // Set user data
        setUserData({
          name: userDetails.name || "Unknown User",
          email: user.email || "No Email",
          studentId: userDetails.student_id || "",
          phoneNumber: userDetails.phone_number || "",
        });
        setStudentId(userDetails.student_id || "");
        setPhoneNumber(userDetails.phone_number || "");
      } catch (error) {
        Alert.alert("Error", "Failed to load account details.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, []);

  const updateUserData = async (field: "student_id" | "phone_number", value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const emailDomain = user.email?.split("@")[1] || "";
      const table = emailDomain === "neu.edu.ph" ? "institutional_users" : "guest_users";
      
      const { error } = await supabase
        .from(table)
        .update({ [field]: value })
        .eq("id", user.id);
      
      if (error) throw error;
      Alert.alert("Success", "Information updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update information");
    }
  };
  
  

  const handleLogout = async () => {
    try {
      // Fetch the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert("Error", "No user found.");
        return;
      }
  
      const userId = user.id;  
      const userEmail = user.email || "No Email";
  
      console.log("🔹 User Data:", user); // Debugging
  
      // Fetch user details from "profiles" table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")  
        .select("*")  
        .eq("id", userId)  
        .single();
  
      if (profileError || !profile) {
        console.error("❌ Profile fetch error:", profileError?.message || "Profile not found");
      } else {
        console.log("✅ Profile Data:", profile);
      }
  
      // Extract name from profile OR user metadata
      let userName = profile?.full_name || user.user_metadata?.full_name || "Unknown User";
  
      console.log("👤 Final User Name:", userName);
  
      // Determine user type based on email
      let userType = null;
      if (userEmail.endsWith("@neu.edu.ph")) {
        userType = "Institutional";
      } else if (userEmail.endsWith("@gmail.com")) {
        userType = "Guest";
      }
  
      console.log("📩 Email:", userEmail, " | 🏷️ User Type:", userType);
  
      // Log the logout activity
      const { error: logError } = await supabase
        .from("user_logs")  
        .insert([
          {
            user_id: userId, 
            name: userName,
            email: userEmail,
            user_type: userType,  // ✅ Ensured user type is logged
            activity_type: "logout",
            timestamp: new Date().toISOString(),
          },
        ]);
  
      if (logError) {
        console.error("❌ Error logging logout:", logError.message);
      } else {
        console.log(`✅ Logout recorded: ${userId} | ${userName} | ${userEmail} | ${userType}`);
      }
  
      // Perform logout
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
              <TextInput
              style={styles.input}
              value={userData.studentId}
              onChangeText={(text) => setUserData({ ...userData, studentId: text })}
              onSubmitEditing={() => updateUserData("student_id", userData.studentId)}
              placeholder="Enter Student ID Here"
              placeholderTextColor="#A9A9A9" // Gray ghost text
              />

              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput
              style={styles.input}
              value={userData.phoneNumber}
              onChangeText={(text) => setUserData({ ...userData, phoneNumber: text })}
              onSubmitEditing={() => updateUserData("phone_number", userData.phoneNumber)}
              placeholder="Enter Phone Number Here"
              placeholderTextColor="#A9A9A9" // Gray ghost text
            />
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