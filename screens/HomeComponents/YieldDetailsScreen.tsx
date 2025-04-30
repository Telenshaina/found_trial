import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Foundation';
import Icon2 from 'react-native-vector-icons/Ionicons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../supabase';

type YieldDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'YieldDetailsScreen'>;
type YieldDetailsScreenRouteProp = RouteProp<RootStackParamList, 'YieldDetailsScreen'>;

type Props = {
  route: YieldDetailsScreenRouteProp;
};

const YieldDetailsScreen: React.FC<Props> = ({ route }) => {
  const { yieldData, incoming } = route.params;
  const navigation = useNavigation<YieldDetailsScreenNavigationProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'finder' | 'claimer' | null>(null);
  const [hasChatted, setHasChatted] = useState(false);
  const [yieldStatus, setYieldStatus] = useState<string | null>(null);
  const [showChatRequiredModal, setShowChatRequiredModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalActionType, setModalActionType] = useState<'approve' | 'reject' | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteResultModal, setShowDeleteResultModal] = useState<{ success: boolean; message: string } | null>(null);

  const isOwner = userId === yieldData.lost_by;
  const isYielder = userId === yieldData.user_id;

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);
  
  // To get the yield status
  useEffect(() => {
    const fetchYieldStatus = async () => {
      const { data, error } = await supabase
        .from('yields')
        .select('status')
        .eq('yield_id', yieldData.yield_id)
        .single();
  
      if (error) {
        console.error('Error fetching yield status:', error);
      } else {
        setYieldStatus(data?.status || null);
      }
    };
    fetchYieldStatus();
  }, [yieldData.yield_id]);

  const handleApproveYield = async () => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }

    try {
      const { error } = await supabase
        .from('yields')
        .update({ status: 'approved' })
        .eq('yield_id', yieldData.yield_id);

      if (error) throw error;

      Alert.alert('Success', 'Yield has been approved');
      navigation.goBack();
    } catch (error) {
      console.error('Error approving yield:', error);
      Alert.alert('Error', 'Failed to approve yield.');
    }
  };

  const handleRejectYield = async () => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }

    try {
      const { error } = await supabase
        .from('yields')
        .update({ status: 'rejected' })
        .eq('yield_id', yieldData.yield_id);
      
      if (error) throw error;

      Alert.alert('Success', 'Yield has been rejected.');
      navigation.goBack();
    } catch (error) {
      console.error('Error rejecting yield:', error);
      Alert.alert('Error', 'Failed to reject yield.');
    }
  };
  
  const handleDeleteYield = async () => {
    Alert.alert('Delete Yield', 'Are you sure you want to delete this yield?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('yields').delete().eq('yield_id', yieldData.yield_id);
          if (error) {
            Alert.alert('Error', 'Failed to delete yield.');
          } else {
            Alert.alert('Deleted', 'Yield has been deleted.');
            navigation.goBack();
          }
        },
      },
    ]);
  };

  // This will change the item's status to yielded in the lost_items table
  const handleFinderConfirm = async () => {
    try {
      const { error } = await supabase
        .from('yields')
        .update({ owner_confirmed: true })
        .eq('yield_id', yieldData.yield_id);
  
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
        .from('yields')
        .update({ yielder_confirmed: true })
        .eq('yield_id', yieldData.yield_id);
  
      if (error) throw error;
  
      checkFinalization();
      Alert.alert('Success', 'You have confirmed receiving the item.');
    } catch (error: any) {
      console.error('Error confirming receipt:', error.message);
      Alert.alert('Error', 'Failed to confirm receipt.');
    }
  };

  const handleApproveClaim = () => {
    if (!hasChatted) {
      setShowChatRequiredModal(true);
      return;
    }
    setModalActionType('approve');
    setShowConfirmModal(true);
  };
  
  const handleRejectClaim = () => {
    if (!hasChatted) {
      setShowChatRequiredModal(true);
      return;
    }
    setModalActionType('reject');
    setShowConfirmModal(true);
  };  
  
  const handleDeleteClaim = () => {
    setShowDeleteConfirmModal(true);
  };  

  const performAction = async () => {
    if (!modalActionType) return;
  
    try {
      const { error } = await supabase
        .from('yields')
        .update({ status: modalActionType === 'approve' ? 'approved' : 'rejected' })
        .eq('yield_id', yieldData.yield_id);
  
      if (error) throw error;
  
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(`Error ${modalActionType} claim:`, error);
      Alert.alert('Error', `Failed to ${modalActionType} claim.`);
      setShowConfirmModal(false);
    }
  };

  const confirmDeleteClaim = async () => {
    try {
      const { error } = await supabase
        .from('claims')
        .delete()
        .eq('yield_id', yieldData.yield_id);
  
      if (error) {
        setShowDeleteResultModal({ success: false, message: 'Failed to delete item.' });
      } else {
        setShowDeleteResultModal({ success: true, message: 'Claim has been deleted.' });
      }
    } catch (error) {
      console.error('Error deleting claim:', error);
      setShowDeleteResultModal({ success: false, message: 'Failed to delete item.' });
    } finally {
      setShowDeleteConfirmModal(false); // hide confirmation modal
    }
  };

  const handleCloseDeleteResultModal = () => {
    if (showDeleteResultModal?.success) {
      navigation.goBack(); // only navigate if deletion was successful
    }
    setShowDeleteResultModal(null);
  };  


  const checkFinalization = async () => {
    const { data, error } = await supabase
      .from('yields')
      .select('owner_confirmed, yielder_confirmed, item_id')
      .eq('yield_id', yieldData.yield_id)
      .single();
  
    if (error || !data) return;
  
    if (data.owner_confirmed && data.yielder_confirmed) {
      await finalizeReturn(data.item_id);
    }
  };
  
  const finalizeReturn = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('lost_items')
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
        .or(`sender_id.eq.${yieldData.found_by},receiver_id.eq.${yieldData.user_id}`)
        .or(`sender_id.eq.${yieldData.user_id},receiver_id.eq.${yieldData.found_by}`)
        .eq('yield_id', yieldData.yield_id);
        setHasChatted(data && data.length > 0 ? true : false);

    };
    checkChatHistory();
  }, [yieldData]);

  const handleChatPress = () => {
    navigation.navigate('ChatScreen', {
      uploader_id: yieldData.found_by,
      item_name: yieldData.item_name,
      claim_id: yieldData.yield_id,
      user_id: yieldData.user_id,
    });
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }
    await supabase.from('yields').update({ status }).eq('yield_id', yieldData.yield_id);
    Alert.alert('Success', `Yield has been ${status}.`);
    navigation.goBack();
  };

  const handleConfirmReturn = async () => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }
    await supabase.from('yields').update({ owner_confirmed: true }).eq('yield_id', yieldData.yield_id);
    Alert.alert('Success', 'Return confirmed.');
  };

  const handleConfirmReceived = async () => {
    if (!hasChatted) {
      Alert.alert('Chat Required', 'You need to chat before taking action.');
      return;
    }
    await supabase.from('yields').update({ yielder_confirmed: true }).eq('yield_id', yieldData.yield_id);
    Alert.alert('Success', 'Item received confirmed.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon2 name='arrow-back' size={24} color='black' />
      </TouchableOpacity>

      <Text style={styles.title}>Yield Details</Text>

      <View style={styles.detailCard}>
        <Text style={styles.label}>Item Name:</Text>
        <Text style={styles.value}>{yieldData.item_name}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { textTransform: 'capitalize' }]}>{yieldData.status}</Text>

        <Text style={styles.label}>Proof Description:</Text>
        <Text style={styles.value}>{yieldData.description}</Text>

        <Text style={styles.label}>Pickup Location:</Text>
        <Text style={styles.value}>{yieldData.pickup_location}</Text>

        <Text style={styles.label}>Submitted On:</Text>
        <Text style={styles.value}>{new Date(yieldData.created_at).toLocaleString()}</Text>

        {yieldData.proof_url ? (
          <>
            <Text style={styles.label}>Proof Image:</Text>
            <Image source={{ uri: yieldData.proof_url }} style={styles.proofImage} />
          </>
        ) : (
          <Text style={{ marginTop: 10, fontStyle: 'italic' }}>No proof image submitted.</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
              {(yieldData.status.toLowerCase() === 'pending' || yieldData.status.toLowerCase() === 'approved' || yieldData.status.toLowerCase() === 'claimed') && (
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF'}]} onPress={handleChatPress}>
                  <Text style={styles.actionButtonText}>
                    <Icon2 name='chatbubbles' size={18} color='#fff' />  {isYielder ? 'Chat with Uploader' : 'Chat with Yielder'}
                  </Text>
                </TouchableOpacity>
              )}

{yieldStatus && ['approved', 'claimed'].includes(yieldStatus) && (
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionScreenYield', { yieldData})}
            disabled={yieldStatus === 'pending' || yieldStatus === 'rejected'}
            style={[styles.actionButton, { backgroundColor: '#ff9500' }]}
          >
            <Text style={styles.actionButtonText}>
              <Icon2 name="search" size={18} color="#fff" /> View Transaction Process
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {incoming && (yieldData.status.toLowerCase() === 'pending'|| yieldData.status.toLowerCase() === 'claimed') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            onPress={handleApproveClaim}
            disabled={yieldStatus === 'approved' || yieldStatus === 'rejected'}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ffc107' }]}
            onPress={handleRejectClaim}
            disabled={yieldStatus === 'approved' || yieldStatus === 'rejected'}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            onPress={handleDeleteClaim}
            disabled={yieldStatus === 'claimed'}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {yieldStatus === 'rejected' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#dc3545' }]} onPress={handleDeleteClaim}>
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for Chat Required */}
      <Modal visible={showChatRequiredModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chat Required</Text>
            <Text style={styles.modalText}>You must chat with the other user before taking action.</Text>
            <TouchableOpacity onPress={() => setShowChatRequiredModal(false)} style={[styles.modalButton, { backgroundColor: '#0d6efd' }]}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Confirm Approve/Reject */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalActionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}</Text>
            <Text style={styles.modalText}>
              Are you sure you want to {modalActionType === 'approve' ? 'approve' : 'reject'} this claim?
            </Text>

            {/* FIXED button layout */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#dc3545' }]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#28a745' }]} onPress={performAction}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Success */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalText}>Claim has been {modalActionType}ed successfully.</Text>
            <TouchableOpacity onPress={() => { 
              setShowSuccessModal(false); 
              navigation.goBack();
              }} style={styles.modalButton}>
              <Text style={[styles.modalButtonText, { backgroundColor: '#0d6efd' }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Claim</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this claim?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#a3a3a3' }]} onPress={() => setShowDeleteConfirmModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#dc3545' }]} onPress={confirmDeleteClaim}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Result Modal */}
      <Modal visible={showDeleteResultModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{showDeleteResultModal?.success ? 'Deleted' : 'Error'}</Text>
            <Text style={styles.modalText}>{showDeleteResultModal?.message}</Text>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#0d6efd' }]} onPress={handleCloseDeleteResultModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default YieldDetailsScreen;

