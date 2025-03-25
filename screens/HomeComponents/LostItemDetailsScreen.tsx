import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Button, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabase';

const LostItemUploadScreen = ({ route }: { route: any }) => {
  const { item } = route.params;
  const navigation = useNavigation();

  const [lostByUser, setLostByUser] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isProofModalVisible, setProofModalVisible] = useState(false);
  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofData, setProofData] = useState({
    name: "",
    email: "",
    phone: "",
    identifyingInfo: "",
    pickupLocation: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    identifyingInfo: "",
  });

  const isOwner = authUserId === item.posted_by;

  // Fetch authenticated user's ID
  useEffect(() => {
    const fetchAuthUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setAuthUserId(data.user.id);
      } else if (error) {
        console.error('Error fetching auth user:', error);
      }
    };
    fetchAuthUser();
  }, []);

  // Fetch user details based on posted_by UUID
  useEffect(() => {
    const fetchUser = async () => {
      if (item.posted_by) {
        const { data, error } = await supabase
          .from('institutional_users')
          .select('name')
          .eq('id', item.posted_by)
          .single();

        if (data) setLostByUser(data.name);
        if (error) console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [item.posted_by]);

  const handleButtonPress = () => {
    if (isOwner) {
      setStatusModalVisible(true);
    } else {
      setProofModalVisible(true);
    }
  };

  // Function to pick an image for proof submission
 const handlePickImage = async () => {
     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
     if (status !== 'granted') {
       alert('Permission to access gallery is required!');
       return;
     }
   
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       quality: 0.7,
     });
   
     if (!result.canceled) {
       setProofImage(result.assets[0].uri);
     }
   };
  

  // Function to submit proof
  
    
      // Function to submit proof
      const handleSubmitProof = async () => {
        let newErrors = { name: "", email: "", phone: "", identifyingInfo: "" };
      
        if (!proofData.name) newErrors.name = "Full name is required";
        if (!proofData.email) newErrors.email = "Email is required";
        if (!proofData.phone) newErrors.phone = "Phone number is required";
        if (!proofData.identifyingInfo) newErrors.identifyingInfo = "Please provide proof details";
      
        setErrors(newErrors);
        if (Object.values(newErrors).some((error) => error !== "")) return;
      
        setIsSubmitting(true);
      
        let proofUrl = null;
      
        //  Upload image only if an image is selected
        if (proofImage) {
          try {
            const response = await fetch(proofImage);
            const blob = await response.blob(); // Convert image to Blob
            const fileName = `${authUserId}_${Date.now()}.jpg`;
      
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('proofs')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
              });
      
            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              alert('Failed to upload proof image.');
              setIsSubmitting(false);
              return;
            }
      
            proofUrl = supabase.storage.from('proofs').getPublicUrl(fileName).data.publicUrl;
          } catch (error) {
            console.error('Error converting image to Blob:', error);
            alert('Failed to process proof image.');
            setIsSubmitting(false);
            return;
          }
        }
  
    // Insert proof details into Supabase
    const { error } = await supabase
      .from('yields')
      .insert([
        {
          user_id: authUserId,
          item_id: item.id,
          proof_url: proofUrl,
          description: proofData.identifyingInfo,
          status: 'pending',
        },
      ]);
  
    setIsSubmitting(false);
  
    if (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof.');
    } else {
      alert('Proof submitted successfully! The owner will review your request.');
      setProofModalVisible(false);
    }
  };
  
  

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FoundNEU</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={styles.unclaimedBadge}>
            <Text style={styles.unclaimedText}>Unfound</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.postedBy}>
            Lost by: @{lostByUser || 'Loading...'}
          </Text>
          {item.posted_by === 'guest' && (
          <View style={styles.guestTag}>
            <Text style={styles.guestTagText}>Guest</Text>
          </View>
)}

          
        </View>


        <View style={styles.badgeContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Category: {item.category}</Text>
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.image} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Lost</Text>
          <Text style={styles.dateText}>Date Lost: {new Date(item.date_lost).toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {item.description || 'No description available'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        {isOwner && <Text style={styles.ownerNote}>You uploaded this Item</Text>}
        
        <TouchableOpacity style={styles.claimButton} onPress={handleButtonPress}>
          <Text style={styles.claimButtonText}>
            {isOwner ? 'Check Status' : 'I found This Item'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Proof Submission Modal */}
      <Modal visible={isProofModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Submit Proof of Ownership</Text>
                <Text style={styles.modalDescription}>
                  Please provide details to prove this item belongs to you. The owner will review your claim.
                </Text>
      
                {/* Full Name Input */}
                <TextInput
                  style={[styles.input, errors.name && styles.errorInput]}
                  placeholder="Your full name"
                  value={proofData.name}
                  onChangeText={(text) => setProofData({ ...proofData, name: text })}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      
                {/* Email Input */}
                <TextInput
                  style={[styles.input, errors.email && styles.errorInput]}
                  placeholder="Your email"
                  keyboardType="email-address"
                  value={proofData.email}
                  onChangeText={(text) => setProofData({ ...proofData, email: text })}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      
                {/* Phone Input */}
                <TextInput
                  style={[styles.input, errors.phone && styles.errorInput]}
                  placeholder="Your phone number"
                  keyboardType="phone-pad"
                  value={proofData.phone}
                  onChangeText={(text) => setProofData({ ...proofData, phone: text })}
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      
                {/* Identifying Information Input */}
                <TextInput
                  style={[styles.textarea, errors.identifyingInfo && styles.errorInput]}
                  placeholder="Provide details to prove this item belongs to you..."
                  multiline
                  value={proofData.identifyingInfo}
                  onChangeText={(text) => setProofData({ ...proofData, identifyingInfo: text })}
                />
                {errors.identifyingInfo && <Text style={styles.errorText}>{errors.identifyingInfo}</Text>}
      
                {/* Pickup Location (Optional) */}
                <TextInput
                  style={styles.input}
                  placeholder="Preferred pickup location (optional)"
                  value={proofData.pickupLocation}
                  onChangeText={(text) => setProofData({ ...proofData, pickupLocation: text })}
                />
                <TouchableOpacity onPress={handlePickImage} style={[styles.button, { marginVertical: 10 }]}>
                    <Text style={styles.buttonText}>
                      {proofImage ? 'Change Uploaded Image' : 'Optional: Upload Image'}
                    </Text>
                  </TouchableOpacity>
      
                  {proofImage && (
                    <Image source={{ uri: proofImage }} style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 10 }} />
                  )}
      
                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={() => setProofModalVisible(false)} style={[styles.button, styles.cancelButton]}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSubmitProof} style={styles.button}>
                    <Text style={styles.buttonText}>Submit Proof</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
      
      
      
            {/* Check Status Modal */}
            <Modal visible={isStatusModalVisible} animationType="fade" transparent>
              <View style={styles.modalContainer}>
                <View style={styles.statusModalContent}>
                  <Text style={styles.modalTitle}>Item Status</Text>
                  <Text style={styles.statusText}>Your uploaded item is currently being processed.</Text>
                  <Text style={styles.statusText}>No one has claimed the Item you have uploaded</Text>
                  <Text style={styles.infoText}>Check back later for updates.</Text>
                  <Button title="Close" onPress={() => setStatusModalVisible(false)} />
                </View>
              </View>
            </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  headerTitle: { marginLeft: 10, fontSize: 18, fontWeight: 'bold', color: '#DC2626' },

  content: { paddingHorizontal: 16, paddingBottom: 100 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  itemName: { fontSize: 20, fontWeight: 'bold' },
  unclaimedBadge: { backgroundColor: '#FCE7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  unclaimedText: { fontSize: 12, color: '#9D174D', fontWeight: 'bold' },

  postedBy: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  guestTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  guestTagText: {
    color: '#333',
    
    fontWeight: 'bold',
    fontSize: 10,
  },
  

  badgeContainer: { flexDirection: 'row', marginTop: 8 },
  categoryBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryText: { fontSize: 12, color: '#5B21B6', fontWeight: 'bold' },

  imageContainer: {
    backgroundColor: '#E5E7EB',
    width: '100%',
    height: 220,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  image: { width: '100%', height: '100%', borderRadius: 12 },

  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  dateText: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  descriptionBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginTop: 4 },
  descriptionText: { fontSize: 14, color: '#4B5563' },

  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ownerNote: { fontSize: 14, color: '#059669', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  claimButton: { backgroundColor: '#000', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  claimButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

 
  statusText: { fontSize: 16, marginVertical: 10, textAlign: 'center' },
  infoText: { fontSize: 14, color: '#6B7280', marginBottom: 10, textAlign: 'center' }, // Add this line
  
  statusModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "red",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 12,
    color: "red",
    marginBottom: 5,
  },
  errorInput: {
    borderColor: "red",
  },
});

export default LostItemUploadScreen;
