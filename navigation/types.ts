import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

// Define the navigation params
export type RootStackParamList = {
  Home: undefined;
  SearchScreen: { query: string };
  Login: undefined;
  Upload: undefined;
  Notification: undefined;
  Chat: undefined;
  Account: undefined;
};

// Type for navigation prop
export type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, "SearchScreen">;

// Type for route prop
export type SearchScreenRouteProp = RouteProp<RootStackParamList, "SearchScreen">;
