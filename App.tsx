import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import Login from "./screens/Login";
import SearchScreen from "./screens/HomeComponents/SearchScreen";
import FoundItemDetails from "./screens/HomeComponents/FoundItemDetailsScreen";
import LostItemDetails from "./screens/HomeComponents/LostItemDetailsScreen";
import Home from "./screens/Home";
import Upload from "./screens/Upload";
import LostItemUploadScreen from "./screens/HomeComponents/LostItemUploadScreen";
import FoundItemUploadScreen from "./screens/HomeComponents/FoundItemUploadScreen";
import TransactionPage from "./screens/HomeComponents/TransactionPage";
import TransactionScreen from "./screens/HomeComponents/TransactionScreen";
import YieldsTransactionPage from "./screens/HomeComponents/YieldsTransactionPage";
import ClaimedItems from "./screens/HomeComponents/ClaimedItems";
import ClaimDetailsScreen from "./screens/HomeComponents/ClaimDetailsScreen";
import ChatScreen from "./screens/HomeComponents/ChatScreen";
import AuthChecker from "./screens/AuthChecker"; 
import ListOfFoundItems from "./screens/HomeComponents/ListOfFoundItems"; 
import ListOfLostItems from "./screens/HomeComponents/ListOfLostItems";
import ListOfCategorizedItems from "./screens/HomeComponents/ListOfCategorizedItems";
import ListOfAllSurrenderedItems from "./screens/HomeComponents/ListOfAllSurrenderedItems"; 
import BannedPage from "./screens/BannedPage";
        

export type RootStackParamList = {
  AuthChecker: undefined; 
  Login: undefined;
  Main: undefined;
  Setup: undefined;
  Home: undefined;
  SearchScreen: { query: string };
  FoundItemDetails: { item: any };
  LostItemDetails: { item: any };
  Upload: undefined;
  LostItemUploadScreen: undefined;
  FoundItemUploadScreen: undefined;
  TransactionPage: undefined;
  TransactionScreen: { claim: any };
  YieldsTransactionPage: undefined;
  ClaimedItems: undefined;
  ClaimDetailsScreen: { claim: any; incoming: boolean };
  ListOfFoundItems: undefined;
  ListOfLostItems: undefined;
  ListOfCategorizedItems: { title: string }; 
  ListOfAllSurrenderedItems: undefined; 
  ChatScreen: { uploader_id: string; item_name: string };
  Banned: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthChecker" component={AuthChecker} /> 
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen 
          name="FoundItemDetails" 
          component={FoundItemDetails} 
          options={{ title: "Found Item Details", headerShown: true }} 
        />
        <Stack.Screen 
          name="LostItemDetails" 
          component={LostItemDetails} 
          options={{ title: "Lost Item Details", headerShown: true }} 
        />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Upload" component={Upload} />
        <Stack.Screen name="LostItemUploadScreen" component={LostItemUploadScreen} />
        <Stack.Screen name="FoundItemUploadScreen" component={FoundItemUploadScreen} />
        <Stack.Screen name="TransactionPage" component={TransactionPage} />
        <Stack.Screen name="TransactionScreen" component={TransactionScreen} />
        <Stack.Screen name="YieldsTransactionPage" component={YieldsTransactionPage} />
        <Stack.Screen name="ClaimedItems" component={ClaimedItems} />
        <Stack.Screen name="ClaimDetailsScreen" component={ClaimDetailsScreen} />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ListOfFoundItems" 
          component={ListOfFoundItems} 
          options={{ title: "All Found Items", headerShown: true }} 
        />
        <Stack.Screen 
          name="ListOfLostItems" 
          component={ListOfLostItems} 
          options={{ title: "All Lost Items", headerShown: true }} 
        />
        <Stack.Screen 
          name="ListOfCategorizedItems" 
          component={ListOfCategorizedItems} 
          options={{ title: "Categorized Items", headerShown: true }} 
        />
        <Stack.Screen 
          name="ListOfAllSurrenderedItems" // ✅ Add the screen to the navigator
          component={ListOfAllSurrenderedItems} 
          options={{ title: "All Surrendered Items", headerShown: true }} 
        />
        <Stack.Screen name="Banned" component={BannedPage} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
