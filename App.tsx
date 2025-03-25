import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import Login from "./screens/Login";
import Setup from "./screens/Setup";
import SearchScreen from "./screens/HomeComponents/SearchScreen";
import FoundItemDetails from "./screens/HomeComponents/FoundItemDetailsScreen";
import LostItemDetails from "./screens/HomeComponents/LostItemDetailsScreen";
import Home from "./screens/Home";
import Upload from "./screens/Upload";
import LostItemUploadScreen from "./screens/HomeComponents/LostItemUploadScreen";
import FoundItemUploadScreen from "./screens/HomeComponents/FoundItemUploadScreen";
import TransactionPage from "./screens/HomeComponents/TransactionPage";
import ClaimDetailsScreen from "./screens/HomeComponents/ClaimDetailsScreen";
import AuthChecker from "./screens/AuthChecker"; 

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
  ClaimDetailsScreen: { claim: any };

};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthChecker" component={AuthChecker} /> 
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Setup" component={Setup} />
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
        <Stack.Screen name="ClaimDetailsScreen" component={ClaimDetailsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
