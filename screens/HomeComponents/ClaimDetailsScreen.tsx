import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Foundation';
import Icon2 from 'react-native-vector-icons/Ionicons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../supabase';

type ClaimDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClaimDetailsScreen'>;
type ClaimDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ClaimDetailsScreen'>;

type Props = {
  route: ClaimDetailsScreenRouteProp;
};

const ClaimDetailsScreen: React.FC<Props> = ({ route }) => {
  const { claim, incoming } = route.params;
  const navigation = useNavigation<ClaimDetailsScreenNavigationProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'finder' | 'claimer' | null>(null);
  const [hasChatted, setHasChatted] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const isFinder = userId === claim.found_by;
  const isClaimer = userId === claim.user_id;

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);
  
  // To get the claim stats
  useEffect(() => {
    const fetchClaimStatus = async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('status')
        .eq('claim_id', claim.claim_id)
        .single();
  
      if (error) {
        console.error('Error fetching claim status:', error);
      } else {
        setClaimStatus(data?.status || null);
      }
    };
    fetchClaimStatus();
  }, [claim.claim_id]); 
  
  const handleDeleteClaim = async () => {
    Alert.alert('Delete Claim', 'Are you sure you want to delete this claim?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('claims').delete().eq('claim_id', claim.claim_id);
          if (error) {
            Alert.alert('Error', 'Failed to delete claim.');
          } else {
            Alert.alert('Deleted', 'Claim has been deleted.');
            navigation.goBack();
          }
        },
      },
    ]);
  };

  // This will change the item's status to claimed in the found_items table
  const handleFinderConfirm = async () => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ finder_confirmed: true })
        .eq('claim_id', claim.claim_id);
  
      if (error) throw error;
  
      checkFinalization();
      Alert.alert('Success', 'You have confirmed returning the item.');
    } catch (error: any) {
      console.error('Error confirming return:', error.message);
      Alert.alert('Error', 'Failed to confirm return.');
    }
  };
  
  const handleClaimerConfirm = async () => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ claimer_confirmed: true })
        .eq('claim_id', claim.claim_id);
  
      if (error) throw error;
  
      checkFinalization();
      Alert.alert('Success', 'You have confirmed receiving the item.');
    } catch (error: any) {
      console.error('Error confirming receipt:', error.message);
      Alert.alert('Error', 'Failed to confirm receipt.');
    }
  };

  const checkFinalization = async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('finder_confirmed, claimer_confirmed, item_id')
      .eq('claim_id', claim.claim_id)
      .single();
  
    if (error || !data) return;
  
    if (data.finder_confirmed && data.claimer_confirmed) {
      await finalizeReturn(data.item_id);
    }
  };
  
  const finalizeReturn = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('found_items')
        .update({ status: 'claimed' })
        .eq('item_id', itemId);
  
      if (error) throw error;
  
      Alert.alert('Success', 'The item has been marked as claimed.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error finalizing return:', error.message);
      Alert.alert('Error', 'Failed to finalize return.');
    }
  };
  
  // Handle confirmation update
  useEffect(() => {
    const checkChatHistory = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .or(`sender_id.eq.${claim.found_by},receiver_id.eq.${claim.user_id}`)
        .or(`sender_id.eq.${claim.user_id},receiver_id.eq.${claim.found_by}`)
        .eq('claim_id', claim.claim_id);
        setHasChatted(data && data.length > 0 ? true : false);

    };
    checkChatHistory();
  }, [claim]);

  const handleChatPress = () => {
    navigation.navigate('ChatScreen', {
      uploader_id: claim.found_by,
      item_name: claim.item_name,
      claim_id: claim.claim_id,
      user_id: claim.user_id,
    });
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }
    await supabase.from('claims').update({ status }).eq('claim_id', claim.claim_id);
    Alert.alert('Success', `Claim has been ${status}.`);
    navigation.goBack();
  };

  const handleConfirmReturn = async () => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }
    await supabase.from('claims').update({ finder_confirmed: true }).eq('claim_id', claim.claim_id);
    Alert.alert('Success', 'Return confirmed.');
  };

  const handleConfirmReceived = async () => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }
    await supabase.from('claims').update({ claimer_confirmed: true }).eq('claim_id', claim.claim_id);
    Alert.alert('Success', 'Item received confirmed.');
  };
  
  // Approve button
  const confirmReturn = async () => {
    const { error } = await supabase
      .from('claims')
      .update({ finder_confirmed: true })
      .eq('claim_id', claim.claim_id);
  
    if (!error) Alert.alert('Success', 'Return confirmed.');
  };
  
  const confirmReceived = async () => {
    const { error } = await supabase
      .from('claims')
      .update({ claimer_confirmed: true })
      .eq('claim_id', claim.claim_id);
  
    if (!error) Alert.alert('Success', 'Item received confirmed.');
  };
  
  // Update claim status
  useEffect(() => {
    // Subscribe to changes in found_items table
    const channel = supabase
      .channel('found_items')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'found_items' }, async (payload) => {
        // Check if the status has changed to "Claimed"
        if (payload.new.status === 'claimed') {
          // Update the status of the claim in the claims table
          await updateClaimStatusToClaimed(claim.claim_id);
        }
      })
      .subscribe();
  
    // Cleanup the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateClaimStatusToClaimed = async (claimId: number) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ status: 'claimed' })
        .eq('claim_id', claimId);
  
      if (error) throw error;
  
      Alert.alert('Success', 'Claim status updated to "Claimed".');
    } catch (error: any) {
      console.error('Error updating claim status:', error.message);
      Alert.alert('Error', 'Failed to update claim status.');
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon2 name='arrow-back' size={24} color='black' />
      </TouchableOpacity>

      <Text style={styles.title}>Claim Details</Text>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Item Name:</Text>
        <Text style={styles.value}>{claim.item_name}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { textTransform: 'capitalize' }]}>{claim.status}</Text>

        <Text style={styles.label}>Proof Description:</Text>
        <Text style={styles.value}>{claim.description}</Text>

        <Text style={styles.label}>Pickup Location:</Text>
        <Text style={styles.value}>{claim.pickup_location}</Text>

        <Text style={styles.label}>Submitted On:</Text>
        <Text style={styles.value}>{new Date(claim.created_at).toLocaleString()}</Text>

        {claim.proof_url ? (
          <>
            <Text style={styles.label}>Proof Image:</Text>
            <Image source={{ uri: claim.proof_url }} style={styles.proofImage} />
          </>
        ) : (
          <Text style={{ marginTop: 10, fontStyle: 'italic' }}>No proof image submitted.</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
        {(claim.status.toLowerCase() === 'pending' || claim.status.toLowerCase() === 'approved' || claim.status.toLowerCase() === 'claimed') && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF'}]} onPress={handleChatPress}>
            <Text style={styles.actionButtonText}>
              <Icon2 name='chatbubbles' size={18} color='#fff' />  {isFinder ? 'Chat with Claimer' : 'Chat with Uploader'}
            </Text>
          </TouchableOpacity>
        )}
    
        {claimStatus && ['approved', 'claimed'].includes(claimStatus) && (
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionScreen', { claim })}
            disabled={claimStatus === 'pending' || claimStatus === 'rejected'}
            style={[styles.actionButton, { backgroundColor: '#ff9500' }]}
          >
            <Text style={styles.actionButtonText}>
              <Icon2 name="search" size={18} color="#fff" /> View Transaction Process
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {incoming && (claim.status.toLowerCase() === 'pending'|| claim.status.toLowerCase() === 'claimed') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            onPress={confirmReceived}
            disabled={claimStatus === 'pending' || claimStatus === 'rejected'}
          >
            <Text style={styles.actionButtonText}>Confirm Item Received</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            onPress={handleDeleteClaim}
            disabled={claimStatus === 'claimed'}
          >
            <Text style={styles.actionButtonText}>Delete Claim</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  value: {
    marginBottom: 10,
  },
  proofImage: {
    width: 300,
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginVertical: 10,
  },
  actionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ClaimDetailsScreen;
