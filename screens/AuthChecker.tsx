import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../supabase';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Banned: undefined;  // Add the Banned screen to the navigation stack
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AuthChecker = () => {
  const navigation = useNavigation<NavigationProp>();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check failed:', error);
        setCheckingSession(false);
        return;
      }

      const user = data?.session?.user;
      if (!user) {
        // Redirect to Login if no active session
        navigation.replace('Login');
        setCheckingSession(false);
        return;
      }

      const userId = user.id;
      const email = user.email;

      try {
        // Determine the correct table based on email domain
        const table = email?.endsWith('@neu.edu.ph') ? 'institutional_users' : 'guest_users';

        // Fetch user status and force_logout flag
        const { data: userRecord, error: fetchError } = await supabase
          .from(table)
          .select('status, force_logout')
          .eq('id', userId)
          .single();

        if (fetchError) {
          throw new Error(`Error fetching user data: ${fetchError.message}`);
        }

        // If user is banned, prevent access and navigate to Banned page
        if (userRecord?.status === 'banned' && userRecord?.force_logout) {
          await supabase.auth.signOut();
          navigation.replace('Banned');  // Navigate to the Banned screen
          setCheckingSession(false);
          return;
        }

        // Allow access to Main if the user is not banned
        navigation.replace('Main');
        setCheckingSession(false);
      } catch (error) {
        console.error(error instanceof Error ? error.message : 'An unknown error occurred');
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigation]);

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return null;
};

export default AuthChecker;