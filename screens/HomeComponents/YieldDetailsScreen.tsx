import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
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

  const isFinder = userId === yieldData.found_by;
  const isClaimer = userId === yieldData.user_id;

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
                    <Icon2 name='chatbubbles' size={18} color='#fff' />  {isFinder ? 'Chat with Claimer' : 'Chat with Uploader'}
                  </Text>
                </TouchableOpacity>
              )}

        {yieldStatus && ['approved', 'claimed'].includes(yieldStatus) && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('TransactionScreen', { yieldData })}
                    disabled={yieldStatus === 'pending' || yieldStatus === 'rejected'}
                    style={[styles.actionButton, { backgroundColor: '#ff9500' }]}
                  >
                    <Text style={styles.actionButtonText}>
                      <Icon2 name="search" size={18} color="#fff" /> View Transaction Process
                    </Text>
                  </TouchableOpacity>
                )}

        {(isFinder && yieldStatus === 'pending') && (
          <TouchableOpacity onPress={handleApproveYield} style={styles.button}>
            <Text style={styles.buttonText}>Approve Yield</Text>
          </TouchableOpacity>
        )}

        {(isClaimer && yieldStatus === 'approved') && (
          <TouchableOpacity onPress={handleConfirmReceived} style={styles.button}>
            <Text style={styles.buttonText}>Confirm Item Received</Text>
          </TouchableOpacity>
        )}

        {(isFinder && yieldStatus === 'approved') && (
          <TouchableOpacity onPress={handleConfirmReturn} style={styles.button}>
            <Text style={styles.buttonText}>Confirm Item Return</Text>
          </TouchableOpacity>
        )}

        {(isFinder || isClaimer) && (
          <TouchableOpacity onPress={handleRejectYield} style={styles.button}>
            <Text style={styles.buttonText}>Reject Yield</Text>
          </TouchableOpacity>
        )}

        {(isFinder || isClaimer) && (
          <TouchableOpacity onPress={handleDeleteYield} style={[styles.button, { backgroundColor: 'red' }]}>
            <Text style={styles.buttonText}>Delete Yield</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
 
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  
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
 
});

export default YieldDetailsScreen;
