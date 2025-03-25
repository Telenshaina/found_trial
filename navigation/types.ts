import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

// routing of params and class
export type RootStackParamList = {
  Home: undefined;
  SearchScreen: { query: string };
  Login: undefined;
  Upload: undefined;
  Notification: undefined;
  Chat: undefined;
  Account: undefined;
  FoundItemDetails: { item: any };
  LostItemDetails: { item: any };


};

// Type for navigation prop
export type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, "SearchScreen">;

// Type for route prop
export type SearchScreenRouteProp = RouteProp<RootStackParamList, "SearchScreen">;
