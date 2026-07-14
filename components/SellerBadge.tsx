import { Text } from "react-native";
import { type } from "@/constants/theme";

const TIER_LABEL: Record<string, string> = {
  self_certified: "Self-Certified",
  documented: "Documented Sourcing",
  lab_verified: "Lab-Verified",
};

export function SellerBadge({
  score,
  tier,
}: {
  score?: number | null;
  tier?: string | null;
}) {
  if (score == null && !tier) return null;
  return (
    <Text style={type.caption}>
      {score != null ? `${score.toFixed(1)}/10` : "—"}
      {tier ? ` · ${TIER_LABEL[tier] ?? tier}` : ""}
    </Text>
  );
}
