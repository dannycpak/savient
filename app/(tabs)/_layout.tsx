import { Tabs, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import {
  IconCamera,
  IconCollection,
  IconHome,
  IconMarket,
  IconProfile,
} from "@/components/TabIcons";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: focused ? "InstrumentSans_600SemiBold" : "InstrumentSans_400Regular",
        fontSize: 10,
        marginTop: 2,
        color: focused ? colors.primary : colors.tabInactive,
      }}
    >
      {label}
    </Text>
  );
}

function CheckFab() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Visual Check"
      onPress={() => router.push("/(tabs)/check")}
      style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
    >
      <IconCamera />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "InstrumentSans_600SemiBold" },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
          paddingBottom: 18,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => <IconHome color={String(color)} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Collection",
          headerShown: false,
          tabBarIcon: ({ color }) => <IconCollection color={String(color)} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Collection" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="check"
        options={{
          title: "Visual Check",
          headerShown: false,
          tabBarButton: () => (
            <View style={styles.fabWrap}>
              <CheckFab />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Market",
          headerShown: false,
          tabBarIcon: ({ color }) => <IconMarket color={String(color)} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Market" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => <IconProfile color={String(color)} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    top: -18,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
