import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

// routing of params and class
export type RootStackParamList = {
  Home: undefined;
  SearchScreen: { query: string };
  Login: undefined;
  Upload: undefined;
  Notification: undefined;
  Chat: { claim_id: number; user_id: number; uploader_id: number; item_name: string }; // add user_id here if it's needed
  Account: undefined;
  FoundItemDetails: { item: any };
  LostItemDetails: { item: any };
  TransactionPage: undefined;
  YieldsTransactionPage: undefined;
  YieldDetailsScreen: {
    yieldData: any;
    incoming: boolean;
  };

  TransactionScreen: {claim: any}
  TransactionScreenYield: {yieldData: any}
  ClaimedItems: undefined;
  ClaimDetailsScreen: { claim: any; incoming: boolean;};
  ListOfCategorizedItems: { title: string };

  // Updated ChatScreen to include user_id
  ChatScreen: { claim_id: string; user_id: string; uploader_id: string; item_name: string }; // add user_id here
};

// Type for navigation prop
export type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, "SearchScreen">;

// Type for route prop
export type SearchScreenRouteProp = RouteProp<RootStackParamList, "SearchScreen">;