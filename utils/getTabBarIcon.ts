import React from 'react';
import { Image } from 'react-native';

// Import your icons
import HomeIcon from '../assets/icons/home.png';
import HomeIconFilled from '../assets/icons/home-filled.png';
import ChatIcon from '../assets/icons/chat.png';
import ChatIconFilled from '../assets/icons/chat-filled.png';
import UploadIcon from '../assets/icons/upload.png';
import UploadIconFilled from '../assets/icons/upload-filled.png';
import NotifIcon from '../assets/icons/notif.png';
import NotifIconFilled from '../assets/icons/notif-filled.png';
import AccountIcon from '../assets/icons/account.png';
import AccountIconFilled from '../assets/icons/account-filled.png';

// Map icons to their names
const icons: Record<string, any> = {
  Home: HomeIcon,
  HomeFocused: HomeIconFilled,
  Chat: ChatIcon,
  ChatFocused: ChatIconFilled,
  Upload: UploadIcon,
  UploadFocused: UploadIconFilled,
  Notification: NotifIcon,
  NotificationFocused: NotifIconFilled,
  Account: AccountIcon,
  AccountFocused: AccountIconFilled,
};

// Function to get tab bar icon
const getTabBarIcon = (routeName: string, focused: boolean) => {
  const iconName = focused ? `${routeName}Focused` : routeName;
}

export default getTabBarIcon;
