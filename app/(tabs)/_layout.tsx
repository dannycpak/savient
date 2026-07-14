import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/constants/theme";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: focused ? "InstrumentSans_600SemiBold" : "InstrumentSans_400Regular",
        fontSize: 11,
        color: focused ? colors.primary : colors.faint,
      }}
    >
      {label}
    </Text>
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
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Catalog",
          tabBarLabel: ({ focused }) => <TabLabel label="Catalog" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="check"
        options={{
          title: "Visual Check",
          tabBarLabel: ({ focused }) => <TabLabel label="Check" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Market",
          tabBarLabel: ({ focused }) => <TabLabel label="Market" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
