import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Screen, Button, Swatch } from "@/components/ui";
import { ONBOARDING_SLIDES } from "@/constants/demo";
import { colors } from "@/constants/theme";

const SHAPES: [string, string][] = [
  ["#6E5A9E", "#3E3268"],
  ["#5E9E7C", "#2E5E48"],
  ["#D98A97", "#A0455C"],
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const slide = ONBOARDING_SLIDES[step];

  const finish = async () => {
    await SecureStore.setItemAsync("sage.onboarding.done", "1");
    router.replace("/(auth)/signup");
  };

  const next = () => {
    if (step < ONBOARDING_SLIDES.length - 1) setStep(step + 1);
    else finish();
  };

  return (
    <Screen
      edges={["top", "left", "right", "bottom"]}
      style={{ backgroundColor: colors.primaryHover, paddingHorizontal: 28, paddingBottom: 24 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.cream }}>Sage</Text>
        <Pressable onPress={finish} hitSlop={12}>
          <Text style={{ color: colors.sageMist, fontFamily: "InstrumentSans_400Regular", fontSize: 15 }}>Skip</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 36 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-end", height: 150 }}>
          <Swatch colors={SHAPES[0]} style={{ width: 74, height: 110, borderRadius: 16, borderTopRightRadius: 40 }} />
          <Swatch colors={SHAPES[1]} style={{ width: 96, height: 150, borderRadius: 16, borderTopLeftRadius: 40 }} />
          <Swatch colors={SHAPES[2]} style={{ width: 64, height: 88, borderRadius: 16, borderBottomRightRadius: 40 }} />
        </View>
        <View>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 38, lineHeight: 42, color: colors.cream }}>
            {slide.title}
          </Text>
          <Text
            style={{
              marginTop: 14,
              fontSize: 16,
              lineHeight: 24,
              color: colors.sageMist,
              fontFamily: "InstrumentSans_400Regular",
              maxWidth: 300,
            }}
          >
            {slide.body}
          </Text>
        </View>
      </View>

      <View style={{ gap: 22, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: 22,
                height: 6,
                borderRadius: 3,
                backgroundColor: step === i ? colors.cream : "rgba(245,242,235,0.25)",
              }}
            />
          ))}
        </View>
        <Button label={slide.cta} variant="cream" onPress={next} />
      </View>
    </Screen>
  );
}
