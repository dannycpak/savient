import { Text } from "react-native";
import { VISUAL_CHECK_DISCLAIMER } from "@/constants/copy";
import { type } from "@/constants/theme";

/** Mandatory second-opinion disclaimer — must appear on every Visual Check result. */
export function VisualCheckDisclaimer() {
  return (
    <Text
      accessibilityRole="text"
      accessibilityLabel="Visual Check legal disclaimer"
      style={[type.caption, { textAlign: "center" }]}
    >
      {VISUAL_CHECK_DISCLAIMER}
    </Text>
  );
}
