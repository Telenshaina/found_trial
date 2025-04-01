import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';

type TransactionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TransactionScreen'>;
type TransactionScreenRouteProp = RouteProp<RootStackParamList, 'TransactionScreen'>;

type Props = {
  route: TransactionScreenRouteProp;
};

const TransactionScreen: React.FC<Props> = ({ route }) => {
  const { claim } = route.params;
  const navigation = useNavigation<TransactionScreenNavigationProp>();
  const [proof, setProof] = useState<{ image: string; date: string; time: string; place: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [founderName, setFounderName] = useState<string | null>(null);
const [claimerName, setClaimerName] = useState<string | null>(null);

  const isFinder = userId === claim.found_by;
  const isClaimer = userId === claim.user_id;

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    fetchUser();
  }, []);

  
useEffect(() => {
    const fetchUserName = async (userId: string, setName: (name: string | null) => void) => {
      // Check Institutional_user table first
      let { data, error } = await supabase
        .from('institutional_users')
        .select('name')
        .eq('id', userId)
        .single();
  
      if (!error && data) {
        setName(data.name);
        return;
      }
  
      // If not found, check guest table
      ({ data, error } = await supabase
        .from('guest_users')
        .select('name')
        .eq('id', userId)
        .single());
  
      if (!error && data) {
        setName(data.name);
      } else {
        console.error("User not found in either table:", userId);
        setName("Unknown User");
      }
    };
  
    fetchUserName(claim.found_by, setFounderName);
    fetchUserName(claim.user_id, setClaimerName);
  }, [claim.found_by, claim.user_id]);

  useEffect(() => {
    const fetchProof = async () => {
      const { data, error } = await supabase
        .from('proof_of_return')
        .select('image, date, time, place')
        .eq('claim_id', claim.claim_id)
        .single();
      if (error) {
        console.error('Error fetching proof:', error.message);
      } else {
        setProof(data);
      }
    };
    fetchProof();
  }, [claim.claim_id]);

  const handleConfirmReturn = async () => {
    if (!proof) return;
    const { error } = await supabase
      .from('claims')
      .update({ finder_confirmed: true })
      .eq('claim_id', claim.claim_id);
    if (error) Alert.alert('Error', 'Failed to confirm return.');
    else Alert.alert('Success', 'Return confirmed.');
  };

  const handleConfirmReceived = async () => {
    if (!proof) return;
    const { error } = await supabase
      .from('claims')
      .update({ claimer_confirmed: true })
      .eq('claim_id', claim.claim_id);
    if (error) Alert.alert('Error', 'Failed to confirm receipt.');
    else Alert.alert('Success', 'Item received confirmed.');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Transaction Details</Text>
      <Text style={styles.itemText}>Item: {claim.item_name}</Text>
      <Text style={styles.itemText}>Finder: {founderName ?? 'Loading...'}</Text>
      <Text style={styles.itemText}>Claimer: {claimerName ?? 'Loading...'}</Text>
      {proof ? (
        <>
          <Image source={{ uri: proof.image }} style={styles.image} />
          <Text>Date: {proof.date}</Text>
          <Text>Time: {proof.time}</Text>
          <Text>Place: {proof.place}</Text>
        </>
      ) : (
        <Text>No proof of return available yet.</Text>
      )}
      {isFinder && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: proof ? '#4CAF50' : '#B0B0B0' }]} 
          onPress={handleConfirmReturn}
          disabled={!proof}
        >
          <Text style={styles.buttonText}>Confirm Return</Text>
        </TouchableOpacity>
      )}
      {isClaimer && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: proof ? '#007AFF' : '#B0B0B0' }]} 
          onPress={handleConfirmReceived}
          disabled={!proof}
        >
          <Text style={styles.buttonText}>Confirm Received</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backButton: { position: 'absolute', top: 10, left: 10, zIndex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  image: { width: '100%', height: 200, marginBottom: 10 },
  button: { padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
});

export default TransactionScreen;
