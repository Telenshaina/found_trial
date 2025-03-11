import React,  { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import Login from "./screens/Login";
import SearchScreen from "./screens/HomeComponents/SearchScreen";
import ItemDetailsScreen from "./screens/HomeComponents/ItemDetailsScreen"; 
import Setup from "./screens/Setup";
type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Setup: undefined;
  SearchScreen: { query: string };
  ItemDetails: { item: any }; 
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); 
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Setup" component={Setup} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen 
          name="ItemDetails" 
          component={ItemDetailsScreen} 
          options={{ title: "Item Details", headerShown: true }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
