import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import Login from "./screens/Login";
import SearchScreen from "./screens/HomeComponents/SearchScreen"; // ✅ Import SearchScreen

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  SearchScreen: { query: string }; // ✅ Ensure SearchScreen has the correct param
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); 
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Main" component={BottomTabNavigator} /> 
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;