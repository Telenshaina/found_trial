import React from 'react';
import { BackHandler, Image, TouchableOpacity, Text } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Banned: undefined;
};

type BannedPageNavigationProp = StackNavigationProp<RootStackParamList, 'Banned'>;

interface BannedPageProps {
  navigation: BannedPageNavigationProp;
}

const BannedPage: React.FC<BannedPageProps> = ({ navigation }) => {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  const handleExitApp = () => {
    // Exits the app
    BackHandler.exitApp();
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/neu-logo.png')} style={styles.logo} />
      <Text style={styles.title}>
        <span style={{ color: '#2E7D32' }}>Found</span><span style={{ color: '#FFB902' }}>NEU</span>
      </Text>
      <Text style={styles.message}>
        We regret to inform you that your access to this application has been <Text style={styles.suspendedText}>Banned</Text> due to violations of our terms of service.
      </Text>
      <Text style={styles.message}>
        If you believe this is a mistake or would like to appeal, please contact our support team for further assistance.
      </Text>

      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#2E7D32' }]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#FFB902' }]} onPress={handleExitApp}>
          <Text style={styles.buttonText}>Exit App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0C3A2F',
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    color: '#7F8C8D',
    paddingHorizontal: 10,
  },
  suspendedText: {
    color: 'red',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginVertical: 10,
    width: '80%', // Ensure buttons don't stretch too wide
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30, // Makes buttons rounder
    width: '100%', // Full width of the container
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BannedPage;