import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabase';  // Import Supabase client
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

// Define user roles
type UserRole = 'user' | 'admin' | 'superAdmin' | 'guest';

interface UserWithRole extends User {
  role?: UserRole;
}

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await fetchUserRole(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserRole(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (user: User) => {
    try {
      let role: UserRole = 'user'; // Default role

      if (user.email?.endsWith('neu.edu.ph')) {
        const { data } = await supabase
          .from('institutional_users')
          .select('role')
          .eq('id', user.id)
          .single();
        role = (data?.role as UserRole) || 'user';
      } else if (user.email?.endsWith('gmail.com')) {
        const { data } = await supabase
          .from('guest_users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!data) {
          await supabase.from('guest_users').upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || 'Guest User',
            role: 'guest',
          });
          role = 'guest';
        } else {
          role = (data?.role as UserRole) || 'guest';
        }
      } else {
        await signOut();
        Alert.alert("Access Denied", "Only neu.edu.ph or gmail.com email addresses are allowed.");
        return;
      }

      setUser({ ...user, role });
      navigateBasedOnRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const navigateBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        navigation.navigate('AdminDashboard' as never);
        break;
      case 'superAdmin':
        navigation.navigate('SuperAdminDashboard' as never);
        break;
      case 'guest':
        navigation.navigate('GuestDashboard' as never);
        break;
      default:
        navigation.navigate('UserDashboard' as never);
        break;
    }
  };

  const signInWithGoogle = async () => {
    try {
      WebBrowser.maybeCompleteAuthSession(); // Ensure WebBrowser session is handled properly
      const redirectUri = Linking.createURL('/auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert("Authentication Failed", "There was an issue signing in with Google.");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Sign Out Error:', error);
      Alert.alert("Sign Out Failed", "There was an issue signing out.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}