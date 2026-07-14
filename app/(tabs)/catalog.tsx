import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { signedPhotoUrl } from "@/lib/photos";
import { Screen, Button, Card } from "@/components/ui";
import { SpecimenCard, type SpecimenListItem } from "@/components/SpecimenCard";
import { CapacityMeter, SearchField, SegmentedControl } from "@/components/InventoryControls";
import { FREE_TIER, COPY } from "@/constants/copy";
import { formatMoney } from "@/lib/format";
import { space, type } from "@/constants/theme";

type SortKey = "newest" | "value" | "alpha";
type Layout = "list" | "grid";

export default function Catalog() {
  const [rows, setRows] = useState<SpecimenListItem[]>([]);
  const [plan, setPlan] = useState<"free" | "plus">("free");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [layout, setLayout] = useState<Layout>("list");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("specimens")
          .select("id, species, variety, locality, est_value_cents, rarity, created_at")
          .order("created_at", { ascending: false });
        const base = (data as SpecimenListItem[]) ?? [];

        const withThumbs: SpecimenListItem[] = [];
        for (const row of base) {
          const { data: ph } = await supabase
            .from("specimen_photos")
            .select("storage_path")
            .eq("specimen_id", row.id)
            .order("is_primary", { ascending: false })
            .limit(1)
            .maybeSingle();
          let thumbUrl: string | null = null;
          if (ph?.storage_path) {
            try {
              thumbUrl = await signedPhotoUrl(ph.storage_path);
            } catch {
              thumbUrl = null;
            }
          }
          withThumbs.push({ ...row, thumbUrl });
        }
        setRows(withThumbs);

        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
      })();
    }, []),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter(
        (r) =>
          r.species.toLowerCase().includes(q) ||
          (r.locality ?? "").toLowerCase().includes(q) ||
          (r.variety ?? "").toLowerCase().includes(q) ||
          (r.rarity ?? "").toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (sort === "value") {
      sorted.sort((a, b) => (b.est_value_cents ?? -1) - (a.est_value_cents ?? -1));
    } else if (sort === "alpha") {
      sorted.sort((a, b) => a.species.localeCompare(b.species));
    } else {
      sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return sorted;
  }, [rows, query, sort]);

  const totalValue = rows.reduce((s, r) => s + (r.est_value_cents ?? 0), 0);

  const add = () => {
    if (plan === "free" && rows.length >= FREE_TIER.catalogCap) {
      Alert.alert(
        "Catalog full",
        `Free accounts hold ${FREE_TIER.catalogCap} specimens. Sage+ removes the cap.`,
        [
          { text: "Maybe later" },
          { text: "See Sage+", onPress: () => router.push("/paywall") },
        ],
      );
      return;
    }
    router.push("/specimen/new");
  };

  return (
    <Screen style={{ gap: space.md, paddingBottom: 0 }}>
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={type.h1}>My collection</Text>
          <Text style={type.caption}>{formatMoney(totalValue)}</Text>
        </View>
        <CapacityMeter
          used={rows.length}
          cap={plan === "plus" ? null : FREE_TIER.catalogCap}
          label="Catalog capacity"
        />
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search species, locality, rarity…"
        />
        <SegmentedControl
          value={sort}
          onChange={setSort}
          options={[
            { value: "newest", label: "Newest" },
            { value: "value", label: "Value" },
            { value: "alpha", label: "A–Z" },
          ]}
        />
        <SegmentedControl
          value={layout}
          onChange={setLayout}
          options={[
            { value: "list", label: "List" },
            { value: "grid", label: "Grid" },
          ]}
        />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Add specimen" onPress={add} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Analytics"
              variant="ghost"
              onPress={() => router.push("/inventory/analytics")}
            />
          </View>
        </View>
      </View>

      <FlatList
        key={layout}
        data={filtered}
        keyExtractor={(r) => r.id}
        numColumns={layout === "grid" ? 2 : 1}
        columnWrapperStyle={layout === "grid" ? { gap: space.sm } : undefined}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xl }}
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>
              {query ? "No specimens match your search." : COPY.emptyCatalog}
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <View style={layout === "grid" ? { flex: 1 } : undefined}>
            <SpecimenCard
              item={item}
              compact={layout === "list"}
              onPress={() => router.push(`/specimen/${item.id}`)}
            />
          </View>
        )}
      />
    </Screen>
  );
}
