import type { ReactNode } from "react";
import { Tabs, router } from "expo-router";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { IconCamera, IconCollection, IconHome, IconMarket, IconProfile } from "@/components/icons";

function TabItem({
  label,
  focused,
  icon,
}: {
  label: string;
  focused: boolean;
  icon: (color: string) => ReactNode;
}) {
  const color = focused ? colors.primary : "#9AA095";
  return (
    <View style={styles.tabItem}>
      {icon(color)}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </View>
  );
}

function CheckFab() {
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/check")}
      style={styles.fab}
      accessibilityRole="button"
      accessibilityLabel="Visual Check"
    >
      <IconCamera color={colors.cream} size={24} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9AA095",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabItem label="Home" focused={focused} icon={(c) => <IconHome color={c} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Collection",
          tabBarIcon: ({ focused }) => (
            <TabItem label="Collection" focused={focused} icon={(c) => <IconCollection color={c} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="check"
        options={{
          title: "Check",
          tabBarButton: () => <CheckFab />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Market",
          tabBarIcon: ({ focused }) => (
            <TabItem label="Market" focused={focused} icon={(c) => <IconMarket color={c} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabItem label="Profile" focused={focused} icon={(c) => <IconProfile color={c} />} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 78,
    paddingTop: 8,
    paddingBottom: 18,
  },
  tabItem: {
    alignItems: "center",
    gap: 3,
    paddingTop: 2,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 10.5,
    fontFamily: "InstrumentSans_600SemiBold",
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    shadowColor: colors.primaryHover,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
