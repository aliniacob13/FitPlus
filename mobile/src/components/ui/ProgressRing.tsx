import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, typography } from "@/constants/theme";

interface Props {
  size?: number;
  stroke?: number;
  value?: number;    // 0–1
  label?: string;
  sub?: string;
  color?: string;
  trackColor?: string;
}

export const ProgressRing = ({
  size = 146,
  stroke = 12,
  value = 0,
  label,
  sub,
  color,
  trackColor,
}: Props) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, value)));
  const ringColor = color ?? colors.primaryBase;
  const track = trackColor ?? colors.lineColor;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={track} strokeWidth={stroke}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      {(label || sub) && (
        <View style={styles.center}>
          {label && (
            <Text style={[styles.label, { color: colors.ink }]} numberOfLines={1}>
              {label}
            </Text>
          )}
          {sub && <Text style={styles.sub}>{sub}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  sub: {
    ...typography.styles.eyebrow,
    marginTop: 4,
  },
});