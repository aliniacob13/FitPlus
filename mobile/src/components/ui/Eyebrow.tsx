import { Text, type TextStyle } from "react-native";
import { typography } from "@/constants/theme";

interface Props {
  children: React.ReactNode;
  style?: TextStyle;
  size?: number;
}

export const Eyebrow = ({ children, style, size }: Props) => (
  <Text style={[typography.styles.eyebrow, size ? { fontSize: size } : undefined, style]}>
    {children}
  </Text>
);