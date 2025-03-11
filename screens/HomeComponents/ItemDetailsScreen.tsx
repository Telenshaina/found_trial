import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ItemDetailsScreen = ({ route }: { route: any }) => {
  const { item } = route.params;
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FoundNEU</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Item Name */}
        <View style={styles.row}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={styles.unclaimedBadge}>
            <Text style={styles.unclaimedText}>Unclaimed</Text>
          </View>
        </View>

        {/* Posted By */}
        <Text style={styles.postedBy}>Posted by: @userid</Text>

        {/* Category Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Category: {item.category}</Text>
          </View>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.image} />
        </View>

        {/* Location and Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Found</Text>
          <Text style={styles.dateText}>Date Found: {new Date(item.date_found).toLocaleDateString()}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {item.description || 'No description available'}
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}><Text style={styles.tagText}>#Tag</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>#Tag</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>#Tag</Text></View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.claimButton}>
          <Text style={styles.claimButtonText}>Claim Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  backButton: { padding: 8 },
  headerTitle: { marginLeft: 10, fontSize: 18, fontWeight: 'bold', color: '#DC2626' },

  // Main Content
  content: { paddingHorizontal: 16, paddingBottom: 100 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  itemName: { fontSize: 20, fontWeight: 'bold' },
  unclaimedBadge: { backgroundColor: '#FCE7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  unclaimedText: { fontSize: 12, color: '#9D174D', fontWeight: 'bold' },

  postedBy: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  // Category Badge
  badgeContainer: { flexDirection: 'row', marginTop: 8 },
  categoryBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryText: { fontSize: 12, color: '#5B21B6', fontWeight: 'bold' },

  // Image
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

  // Section Title
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  dateText: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  // Description Box
  descriptionBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginTop: 4 },
  descriptionText: { fontSize: 14, color: '#4B5563' },

  // Tags
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderWidth: 1, borderColor: '#9CA3AF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, color: '#6B7280' },

  // Fixed Bottom Button
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
  claimButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ItemDetailsScreen;
