import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, TextInput, Modal } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
  const [image, setImage] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [place, setPlace] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<null | (() => void)>(null);
  const [isReturnConfirmed, setIsReturnConfirmed] = useState(false); // New state to track return confirmation
  const [isReceivedConfirmed, setIsReceivedConfirmed] = useState(false); 

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
      let { data, error } = await supabase
        .from('institutional_users')
        .select('name')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setName(data.name);
        return;
      }
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

  // Pick image from gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Take a photo using the camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Upload proof to Supabase
  const uploadToSupabase = async () => {
    if (!image || !date || !time || !place) {
      alert('Please fill all fields and select an image.');
      return;
    }

    try {
      // Get authenticated user
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) {
        alert('User not authenticated. Please log in.');
        return;
      }
      const userId = user.user.id; // Extract user ID

      const fileName = `images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const response = await fetch(image);
      const blob = await response.blob();

      const { data, error } = await supabase.storage.from('proofs').upload(fileName, blob, {
        contentType: 'image/jpeg', // Ensure correct content type
      });

      if (error) {
        console.error('Upload error:', error);
        alert(`Image upload failed: ${error.message}`);
        return;
      }

      const imageUrl = supabase.storage.from('proofs').getPublicUrl(fileName).data.publicUrl;

      // Insert proof of return data into 'proof_of_return' table
      const { error: dbError } = await supabase.from('proof_of_return').insert([
        {
          claim_id: claim.claim_id,
          image: imageUrl,
          date,
          time,
          place,
        },
      ]);

      if (dbError) {
        console.error('Database error:', dbError);
        alert(`Failed to upload proof: ${dbError.message}`);
        return;
      }

      alert('Proof uploaded successfully!');
      setProof({ image: imageUrl, date, time, place });
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  // Handle delete proof
  const deleteProof = async () => {
    try {
      const { error } = await supabase
        .from('proof_of_return')
        .delete()
        .eq('claim_id', claim.claim_id);
      
      if (error) {
        console.error('Error deleting proof:', error.message);
        alert('Failed to delete proof.');
        return;
      }
      setProof(null); // Remove proof from state
      alert('Proof deleted successfully!');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong while deleting the proof.');
    }
  };

  // Handle confirm return for Finder
  const handleConfirmReturn = () => {
    if (!proof) return;
    setConfirmationAction(() => async () => {
      await confirmReturn();
      setIsReturnConfirmed(true);  // Disable the Confirm Return button after confirmation
      setModalVisible(false);
    });
    setModalVisible(true);
  };
  
  // Handle confirm received for Claimer
  const handleConfirmReceived = () => {
    if (!proof) return;
    setConfirmationAction(() => async () => {
      await confirmReceived();
      setIsReceivedConfirmed(true);  // Disable the Confirm Received button after confirmation
      setModalVisible(false);
    });
    setModalVisible(true);
  };
  
  const checkAndUpdateItemStatus = async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('finder_confirmed, claimer_confirmed,item_id, user_id') // Fetching user_id as the Claimed_by user
      .eq('claim_id', claim.claim_id)
      .single();
  
    if (error || !data) {
      console.error('Error fetching claim data:', error);
      return;
    }
  
    // If both finder and claimer have confirmed, update the found_items status to "Claimed"
    if (data.finder_confirmed && data.claimer_confirmed) {
      const { error: updateError } = await supabase
        .from('found_items')
        .update({
          status: 'Claimed',
          claimed_by: data.user_id // Update the Claimed_by column with the user_id of the claimer
        })
        .eq('item_id', data.item_id);
  
      if (updateError) {
        console.error('Error updating item status:', updateError.message);
      } else {
        console.log('Item status updated to "Claimed" and Claimed_by updated');
      }
    }
  };
  
  
  
  // Call this function after confirming the return or the received status.
  const confirmReturn = async () => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ finder_confirmed: true })
        .eq('claim_id', claim.claim_id);
      
      if (error) throw error;
  
      // Check and update item status after the update
      await checkAndUpdateItemStatus();
      Alert.alert('Success', 'Return confirmed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm return.');
    }
  };
  
  const confirmReceived = async () => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ claimer_confirmed: true })
        .eq('claim_id', claim.claim_id);
  
      if (error) throw error;
  
      // Check and update item status after the update
      await checkAndUpdateItemStatus();
      Alert.alert('Success', 'Item received confirmed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm receipt.');
    }
  };
  
  
  
  
  useEffect(() => {
    const fetchConfirmationStatus = async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('finder_confirmed, claimer_confirmed')
        .eq('claim_id', claim.claim_id)
        .single();
  
      if (error) {
        console.error('Error fetching confirmation status:', error.message);
        return;
      }
  
      if (data) {
        setIsReturnConfirmed(data.finder_confirmed);
        setIsReceivedConfirmed(data.claimer_confirmed);
      }
    };
  
    fetchConfirmationStatus();
  }, [claim.claim_id]);
  
  
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

          {isFinder && (
          <TouchableOpacity onPress={deleteProof} style={styles.button}>
            <Text style={styles.buttonText}>Delete Proof</Text>
          </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text>No proof of return available yet.</Text>
          {/* Allow user to upload image or take photo */}
          {isFinder  && (
            <>
              <TouchableOpacity onPress={pickImage} style={styles.button}>
                <Text style={styles.buttonText}>Select Proof Image</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.button}>
                <Text style={styles.buttonText}>Take a Photo</Text>
              </TouchableOpacity>

              {image && <Image source={{ uri: image }} style={styles.image} />}
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (HH:MM)"
                value={time}
                onChangeText={setTime}
              />
              <TextInput
                style={styles.input}
                placeholder="Place"
                value={place}
                onChangeText={setPlace}
              />
              <TouchableOpacity onPress={uploadToSupabase} style={styles.button}>
                <Text style={styles.buttonText}>Submit Proof</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* Confirm Return button for Finder */}
      {isFinder && (
      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: isReturnConfirmed || !proof ? '#B0B0B0' : '#28A745'  // Green when enabled, Light Gray when disabled
        }]}
        onPress={handleConfirmReturn}
        disabled={!proof || isReturnConfirmed}  // Disable if proof is not available or already confirmed
      >
        <Text style={styles.buttonText}>Confirm Return</Text>
      </TouchableOpacity>
    )}

    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Are you sure you want to confirm?</Text>
          <Text style={styles.modalText}>The item will be marked as Claimed</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => { 
              confirmationAction?.(); 
              setModalVisible(false); 
            }} style={styles.button}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.button, { backgroundColor: '#DC3545' }]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Confirm Received button for Claimer */}
    {isClaimer && (
      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: isReceivedConfirmed || !proof ? '#B0B0B0' : '#007BFF'  // Blue when enabled, Light Gray when disabled
        }]}
        onPress={handleConfirmReceived}
        disabled={!proof || isReceivedConfirmed}  // Disable if proof is not available or already confirmed
      >
        <Text style={styles.buttonText}>Confirm Received</Text>
      </TouchableOpacity>
    )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40 },
  backButton: { position: 'absolute', top: 10, left: 10, zIndex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  image: { width: '100%', height: 200, marginBottom: 10 },
  button: { padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10, backgroundColor: '#007AFF' },
  buttonText: { color: '#fff', fontSize: 16 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginVertical: 5, paddingHorizontal: 8 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  
});

export default TransactionScreen;
