import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define navigation types
type RootStackParamList = {
  Login: undefined;
  Account: undefined;
};

type NavigationProps = StackNavigationProp<RootStackParamList, "Account">;

type AccountProps = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

const Account: React.FC<AccountProps> = ({ setIsLoggedIn }) => {
  const navigation = useNavigation<NavigationProps>();

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.accountTitle}>Account</Text>
      <View style={styles.profileContainer}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.name}>Juan Dela Cruz</Text>
        <Text style={styles.role}>STUDENT</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput style={styles.input} value="juan.delacruz@neu.edu.ph" editable={false} />
        <Text style={styles.label}>STUDENT ID</Text>
        <TextInput style={styles.input} value="22-01345-678" editable={false} />
        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput style={styles.input} value="+63 090 1234 567" editable={false}/>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 10,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#ccc',
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: 'gray',
  },
  infoContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'gray',
    marginTop: 25,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Account;
