import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from './constants/colors';
import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import TrackScreen from './screens/TrackScreen';
import AllComplaintsScreen from './screens/AllComplaintsScreen';
import AdminScreen from './screens/AdminScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function tabIcon(name, outlineName) {
  return ({ color, size, focused }) => (
    <Ionicons name={focused ? name : outlineName} size={size} color={color} />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: COLORS.card },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          title: 'Report',
          tabBarIcon: tabIcon('water', 'water-outline'),
        }}
      />
      <Tab.Screen
        name="Track"
        component={TrackScreen}
        options={{
          title: 'Track',
          tabBarIcon: tabIcon('search', 'search-outline'),
        }}
      />
      <Tab.Screen
        name="All Complaints"
        component={AllComplaintsScreen}
        options={{
          title: 'All Complaints',
          tabBarIcon: tabIcon('list', 'list-outline'),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
