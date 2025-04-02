import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../supabase';
import { useEffect, useState } from 'react';


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
  
  //to get the claim stats
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

  

  
  
  //This will change the item's status to claimed in the foundy_items table
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
  
  //approve button
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
  
  //update claim status
  useEffect(() => {
    // Subscribe to changes in found_items table
    const channel = supabase
      .channel('found_items')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'found_items' }, async (payload) => {
        // Check if the status has changed to "Claimed"
        if (payload.new.status === 'Claimed') {
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
        .update({ status: 'Claimed' })
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
        <Text style={styles.backText}>← Back</Text>
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

      {(claim.status.toLowerCase() === 'pending' || claim.status.toLowerCase() === 'approved') && (
        <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
          <Text style={styles.chatButtonText}>
            {isFinder ? 'Chat with Claimer' : 'Chat with Uploader'}
          </Text>
        </TouchableOpacity>
      )}

        {incoming && claim.status.toLowerCase() === 'pending' && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => handleStatusUpdate('approved')}
            >
            <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF4C4C' }]}
            onPress={() => handleStatusUpdate('rejected')}
            >
            <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
        </View>
        )}


      {(isFinder || isClaimer) && (
        <TouchableOpacity 
        style={[
          styles.actionButton, 
          { 
            backgroundColor: '#FFA500', 
            opacity: claimStatus === 'approved' ? 1 : 0.5 
          }
        ]}
        onPress={() => {
          if (claimStatus === 'approved') {
            navigation.navigate('TransactionScreen', { claim });
          } else {
            Alert.alert('Action Not Allowed', 'The claim must be approved before viewing the transaction process.');
          }
        }}
        disabled={claimStatus !== 'approved'}
      >
        <Text style={styles.actionButtonText}>View Transaction Process</Text>
      </TouchableOpacity>
      
      )}

        

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClaim}>
        <Text style={styles.deleteButtonText}>Delete Claim</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {actionType === 'finder' ? 'Confirm Return' : 'Confirm Received'}
          </Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to proceed?
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#FF4C4C' }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#4CAF50' }]} 
              onPress={() => {
                setModalVisible(false);
                actionType === 'finder' ? confirmReturn() : confirmReceived();
              }}
            >
              <Text style={styles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </ScrollView>


    
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  detailCard: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  label: { fontWeight: 'bold', marginTop: 12, alignSelf: 'flex-start' },
  value: { fontSize: 16, marginTop: 4, alignSelf: 'flex-start' },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 12,
  },
  chatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF4C4C',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow effect
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
});

export default ClaimDetailsScreen;