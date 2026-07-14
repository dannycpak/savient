import Svg, { Circle, Path, Rect } from "react-native-svg";

export function IconHome({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconCollection({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={5} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.7} />
      <Rect x={13} y={5} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.7} />
      <Rect x={4} y={14} width={7} height={5} rx={1.5} stroke={color} strokeWidth={1.7} />
      <Rect x={13} y={14} width={7} height={5} rx={1.5} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function IconMarket({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h16l-1.2 11H5.2L4 8zM8 8V6a4 4 0 018 0v2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconProfile({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={3.2} stroke={color} strokeWidth={1.7} />
      <Path
        d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5S17.1 16 18.5 19"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconCamera({ color = "#F5F2EB", size = 26 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5A2.5 2.5 0 016.5 6h2l1.2-1.5h4.6L15.5 6H17.5A2.5 2.5 0 0120 8.5v8A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12.5} r={3.2} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}
