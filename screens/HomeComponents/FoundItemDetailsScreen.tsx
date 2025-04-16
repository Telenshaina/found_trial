import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Button, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabase';
import EditItem from './EditItem';
import ClaimReportModal from '../../assets/modals/ClaimReportModal';

const FoundItemDetailsScreen = ({ route }: { route: any }) => {
  const { item } = route.params;
  const navigation = useNavigation();
  
  const [reason, setReason] = useState<string>(''); 
  const currentUser = supabase.auth.getUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [foundByUser, setFoundByUser] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isProofModalVisible, setProofModalVisible] = useState(false);
  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [foundItemStatus, setFoundItemStatus] = useState<string | null>(null);
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
  const [editData, setEditData] = useState({
    itemName: item.item_name,
    description: item.description,
  });

  const isOwner = authUserId === item.found_by;
  // CLOSING MODAL
  const handleClose = () => {
    setModalVisible(false);
    setProofModalVisible(false);
    setStatusModalVisible(false);
  };

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

  // Fetch user details based on found_by UUID
  useEffect(() => {
    const fetchUser = async () => {
      if (item.found_by) {
        const { data, error } = await supabase
          .from('institutional_users')
          .select('name')
          .eq('id', item.found_by)
          .single();

        if (data) setFoundByUser(data.name);
        if (error) console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [item.found_by]);
  
    // Fetch user details and update state
    useEffect(() => {
      const fetchUserDetails = async () => {
        if (!authUserId) return;

        const { data, error } = await supabase
          .from('institutional_users')
          .select('name, email, phone_number')
          .eq('id', authUserId)
          .single();

        if (data) {
          setProofData((prevData) => ({
            ...prevData,
            name: data.name,
            email: data.email,
            phone: data.phone_number,
          }));
        }

        if (error) {
          console.error('Error fetching user details:', error);
        }
      };

      fetchUserDetails();
    }, [authUserId]);

    // Fetch the status of the found item
    useEffect(() => {
      const fetchItemStatus = async () => {
        const { data, error } = await supabase
          .from('found_items')
          .select('status')
          .eq('item_id', item.item_id)
          .single();

        if (data) {
          setFoundItemStatus(data.status);
        }
        if (error) {
          console.error('Error fetching item status:', error);
        }
      };

      fetchItemStatus();
    }, [item.item_id]);
  
    const handleEditSubmit = () => {
      alert('Edit functionality is still in the works.');
      setEditModalVisible(false);
    };
       
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

  // Claim Report
  const handleSubmitClaim = async (data: {
    item_id: string;
    reason: string;
    imageUri: string | null;
    user: { name: string; email: string; phone: string };
  }) => {
    try {
      setIsSubmitting(true);
  
      console.log("Submitting claim report:", data);
  
      const { error } = await supabase
        .from("claim_reports")
        .insert([
          {
            item_id: item.item_id,
            name: data.user.name,  
            email: data.user.email,
            phone_number: data.user.phone,
            reason: data.reason, 
            proof_url: data.imageUri,  
          },
        ]);
  
  
      if (error) {
        console.error("Error submitting claim report", error);
        alert("Failed to submit claim.");
      } else {
        alert("Claim report submitted successfully.");
      }
    } catch (error) {
      console.error("Error submitting claim report", error);
      alert("Failed to submit claim.");
    } finally {
      setIsSubmitting(false);
    }
  };  


    // Submit Claim Report
    const submitClaim = async () => {
      if (!authUserId) {
        alert("User not authenticated.");
        return;
      }
    
      setIsSubmitting(true);
    
      try {
        const { error } = await supabase.from("claim_reports").insert([
          {
            item_id: item.item_id,
            user_id: authUserId,
            reason: reason,  
            name: proofData.name,
            email: proofData.email,
            phone: proofData.phone,
            proof_url: proofImage, 
            created_at: new Date().toISOString(),
            status: "pending", 
          },
        ]);
    
        if (error) {
          console.error("Error inserting claim report:", error);
          alert("Failed to submit claim report.");
        } else {
          console.log(item.item_id); // Logs the item_id to the console
          alert("Claim report submitted successfully.");
          setProofModalVisible(false); // Close the modal
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        alert("Something went wrong.");
      } finally {
        setIsSubmitting(false);
      }
    };    

  // Function to submit proof
  const handleSubmitProof = async () => {
    let newErrors = { name: "", email: "", phone: "", identifyingInfo: "", pickupLocation: "" };
  
    if (!proofData.name) newErrors.name = "Full name is required";
    if (!proofData.email) newErrors.email = "Email is required";
    if (!proofData.phone) newErrors.phone = "Phone number is required";
    if (!proofData.identifyingInfo) newErrors.identifyingInfo = "Please provide proof details";
    if (!proofData.pickupLocation) newErrors.pickupLocation = "Please provide location details";
  
    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error !== "")) return;
  
    setIsSubmitting(true);
  
    let proofUrl = null;
  
    // Upload image only if an image is selected
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
      .from('claims')
      .insert([
        {
          user_id: authUserId,
          item_id: item.item_id,
          proof_url: proofUrl,
          description: proofData.identifyingInfo,
          pickup_location: proofData.pickupLocation,
          status: 'pending',
        },
      ]);
  
    if (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof.');
      setIsSubmitting(false);
      return;
    }
  
    // Add notification to the notifications table
    const { data: foundItemData, error: foundItemError } = await supabase
      .from('found_items')
      .select('found_by')
      .eq('item_id', item.item_id)
      .single();
  
    if (foundItemError) {
      console.error('Error fetching found item details:', foundItemError);
      alert('Failed to fetch found item details for notification.');
      setIsSubmitting(false);
      return;
    }
  
    const receiverId = foundItemData.found_by; // The user who found the item
  
    // Fetch sender's name from guest_users
let { data: guestData, error: guestError } = await supabase
.from('guest_users')
.select('name')
.eq('id', authUserId)
.single();

// If not found in guest_users, check institutional_users
let senderName = '';
if (guestData && guestData.name) {
senderName = guestData.name;
} else {
let { data: institutionalData, error: institutionalError } = await supabase
  .from('institutional_users')
  .select('name')
  .eq('id', authUserId)
  .single();

if (institutionalData && institutionalData.name) {
  senderName = institutionalData.name;
}
}

// Now insert into notifications
const { error: notificationError } = await supabase
.from('notifications')
.insert([
  {
    receiver_id: receiverId,
    sender_id: authUserId,
    item_id: item.item_id,
    message: `${senderName} has submitted proof of ownership for the item "${item.item_name}".`,
    read: false,
  },
]);

  
    if (notificationError) {
      console.error('Error inserting notification:', notificationError);
      alert('Failed to send notification.');
    } else {
      alert('Proof submitted successfully! The owner will review your request.');
    }
  
    setIsSubmitting(false);
    setProofModalVisible(false);
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
          <View 
            style={[
              styles.unclaimedBadge, 
              foundItemStatus?.toLowerCase() === "claimed" && styles.claimedBadge
            ]}
          >
            <Text 
              style={[
                styles.unclaimedText, 
                foundItemStatus?.toLowerCase() === "claimed" && styles.claimedText
              ]}
            >
              {foundItemStatus 
                ? foundItemStatus.charAt(0).toUpperCase() + foundItemStatus.slice(1) 
                : "Loading..."}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.postedBy}>
            Found by: @{foundByUser || 'Loading...'}
          </Text>
          {item.found_by === 'guest' && (
          <View style={styles.guestTag}>
            <Text style={styles.guestTagText}>Guest</Text>
          </View>
          )}
        </View>

        <View style={styles.badgeContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Category: {item.category}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
              <Text style={styles.editButtonText}>
                <Icon name='edit' size={14} color='#007bff' />  Edit Item</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.image} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Found</Text>
          <Text style={styles.dateText}>Date Found: {new Date(item.date_found).toLocaleDateString()}</Text>
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
        {isOwner && <Text style={styles.ownerNote}>This is your item</Text>}
        
        {foundItemStatus?.toLowerCase() === "claimed" ? (
        // If the item is claimed, check if the current user is the one who claimed it
        item.claimed_by === authUserId ? (
          <Text style={styles.claimedText}>You claimed this item</Text>
        ) : (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => {
              setModalVisible(true)
              alert("You are about to file a report for this Claimed Item. Please click OK to continue.");
            }}
          >
            <Text style={styles.claimButtonText}>File a Claim Report</Text>
          </TouchableOpacity>
        )
      ) : (
        // If the item is not claimed, show the claim button
        <TouchableOpacity style={styles.claimButton} onPress={handleButtonPress}>
          <Text style={styles.claimButtonText}>
            {isOwner ? 'Check Status' : 'Claim Item'}
          </Text>
        </TouchableOpacity>
      )}
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

    {/* Claim Report Modal */}
    <ClaimReportModal
        visible={modalVisible}
        handleClose={() => setModalVisible(false)}
        itemId={item.item_id}
        user={proofData}
        isSubmitting={isSubmitting}
        handleSubmitClaim={handleSubmitClaim}
        handlePickImage={handlePickImage}
        reason={reason}
      />


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
    
    {/* Edit Item Modal */}
    <EditItem
      visible={isEditModalVisible}
      onClose={() => setEditModalVisible(false)}
      onSubmit={handleEditSubmit}
      editData={editData}
      setEditData={setEditData} />
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
  claimedBadge: {
    backgroundColor: "#D1FAE5", // Light green background
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  claimedText: {
    color: "#065F46", // Dark green text
    fontWeight: "bold",
  },
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
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
  image: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'contain' },
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
  editButton: { backgroundColor: '#e1eefc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 'auto', },
  editButtonText: { fontSize: 12, color: '#007bff', fontWeight: 'bold' },
});

export default FoundItemDetailsScreen;