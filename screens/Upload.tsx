import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import Header from './Header';
import LostItemForm from './HomeComponents/LostItemUploadScreen';
import FoundItemForm from './HomeComponents/FoundItemUploadScreen';

const Upload = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(1);
  const [routes] = useState([
    { key: 'missing', title: 'Report Lost Item' },
    { key: 'found', title: 'Report Found Item' },
  ]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'missing':
        return <LostItemForm />;
      case 'found':
        return <FoundItemForm />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: 'black' }}
            style={{ backgroundColor: 'white' }}
            activeColor="black"
            inactiveColor="gray"
          />
        )}
      />
    </SafeAreaView>
  );
};

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  main: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 15, 
    fontWeight: 'normal', 
    fontStyle: 'italic', 
    marginBottom: 16, 
    textAlign: 'center',
    color: '#666',
  },
  label: {
    fontSize: 14,
    color: 'black',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 50,
    backgroundColor: '#fff',
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonGroup: {
    flexDirection: 'row', 
    gap: 16, 
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  outlineButtonText: {
    fontSize: 16,
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    minWidth: 100,
  },
});

export default Upload;
