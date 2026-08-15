import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { CATEGORY_FIELDS } from '../utils/categoryFields';
import { COLORS } from '../utils/theme';

import SignIn from '../screens/SignIn';
import SignUp from '../screens/SignUp';
import DashboardScreen from '../screens/DashboardScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ExpenseScreen from '../screens/ExpenseScreen';
import BudgetScreen from '../screens/BudgetScreen';
import WishlistScreen from '../screens/WishlistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Wrapper so ExpenseScreen gets category/title/fields from route params
function ExpenseScreenWrapper({ route }) {
  const { category, title } = route.params;
  return (
    <ExpenseScreen
      category={category}
      title={title}
      fields={CATEGORY_FIELDS[category] || []}
    />
  );
}

function CategoriesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
      <Stack.Screen
        name="Expense"
        component={ExpenseScreenWrapper}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'bar-chart' : 'bar-chart-outline',
            Categories: focused ? 'grid' : 'grid-outline',
            Budget: focused ? 'wallet' : 'wallet-outline',
            Wishlist: focused ? 'heart' : 'heart-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { borderTopColor: COLORS.border, paddingBottom: 4 },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Analytics' }} />
      <Tab.Screen name="Categories" component={CategoriesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Budget" component={BudgetScreen} options={{ title: 'Budgets' }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="SignUp" component={SignUp} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
