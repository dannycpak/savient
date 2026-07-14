import { View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, swatchFor, type Swatch as SwatchToken } from "@/constants/theme";

export function Swatch({
  name,
  colors: override,
  style,
  height = 110,
  rounded = radius.md,
}: {
  name?: string;
  colors?: readonly [string, string];
  style?: ViewStyle;
  height?: number;
  rounded?: number;
}) {
  const token: SwatchToken = override
    ? { colors: override }
    : swatchFor(name ?? "fluorite");
  return (
    <View style={[{ overflow: "hidden", borderRadius: rounded }, style]}>
      <LinearGradient
        colors={[token.colors[0], token.colors[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: "100%", height }}
      />
    </View>
  );
}
