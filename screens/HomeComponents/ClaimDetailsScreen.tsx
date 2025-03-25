import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../supabase';

type ClaimDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ClaimDetailsScreen'>;
type ClaimDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClaimDetailsScreen'>;

type Props = {
  route: ClaimDetailsScreenRouteProp;
};

const ClaimDetailsScreen: React.FC<Props> = ({ route }) => {
  const { claim } = route.params;
  const navigation = useNavigation<ClaimDetailsScreenNavigationProp>();

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

  const handleChatPress = () => {
    navigation.navigate('Chat', {
      uploader_id: claim.found_by, 
      item_name: claim.item_name,
    });
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

      {claim.status.toLowerCase() === 'approved' && (
        <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
          <Text style={styles.chatButtonText}>Chat with Uploader</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClaim}>
        <Text style={styles.deleteButtonText}>Delete Claim</Text>
      </TouchableOpacity>
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
});

export default ClaimDetailsScreen;
