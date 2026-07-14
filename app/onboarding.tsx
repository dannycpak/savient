import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button } from "@/components/ui";
import { Swatch } from "@/components/Swatch";
import { COPY } from "@/constants/copy";
import { appStorage } from "@/lib/storage";
import { colors, space, type } from "@/constants/theme";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const card = COPY.onboarding[step];
  const last = step === COPY.onboarding.length - 1;

  const finish = async () => {
    await appStorage.setItem("sage.onboarding.done", "1");
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (last) finish();
    else setStep((s) => s + 1);
  };

  return (
    <Screen dark style={{ justifyContent: "space-between", paddingTop: space.xl }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.onDark }}>
          Sage
        </Text>
        <Pressable onPress={finish} hitSlop={12}>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: colors.onDarkFaint }}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 28, alignItems: "center" }}>
        <Swatch name={card.swatch} height={180} rounded={40} style={{ width: 180 }} />
        <View style={{ gap: 12 }}>
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular",
              fontSize: 34,
              lineHeight: 40,
              color: colors.onDark,
              textAlign: "center",
            }}
          >
            {card.title}
          </Text>
          <Text style={{ ...type.body, color: colors.onDarkMuted, textAlign: "center" }}>
            {card.body}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {COPY.onboarding.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 18 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === step ? colors.onDark : "rgba(245,242,235,0.25)",
              }}
            />
          ))}
        </View>
      </View>

      <Button label={card.cta} variant="bone" onPress={next} />
    </Screen>
  );
}
