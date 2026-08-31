import { AbsoluteFill } from "remotion";
import type { ReactNode } from "react";

interface ChatWindowProps {
  backgroundColor: string;
  children: ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  backgroundColor,
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
