import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { MessageCard } from "./MessageCard";
import { Avatar } from "./Avatar";
import { theme } from "../theme";

interface AIMessageProps {
  brandName: string;
  logoSrc?: string;
  text: string;
  entryDelay?: number;
  exitFrame?: number;
  children?: ReactNode;
  assignee?: {
    name: string;
    avatar?: string;
  };
}

export const AIMessage: React.FC<AIMessageProps> = ({
  brandName,
  logoSrc,
  text,
  entryDelay = 0,
  exitFrame,
  children,
  assignee,
}) => {
  return (
    <MessageCard entryDelay={entryDelay} exitFrame={exitFrame}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <BrandLogo size={44} imageSrc={logoSrc} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: theme.typography.weight.semibold,
              color: theme.colors.text.default,
              marginBottom: 8,
            }}
          >
            {brandName}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: theme.typography.weight.regular,
              color: theme.colors.text.default,
              lineHeight: 1.5,
            }}
          >
            {text}
          </div>
          {/* Embedded content (charts, etc.) */}
          {children && <div style={{ marginTop: 16 }}>{children}</div>}
          {/* Assignee badge */}
          {assignee && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Avatar src={assignee.avatar} name={assignee.name} size={28} />
              <span
                style={{
                  fontSize: theme.typography.size.body,
                  fontWeight: theme.typography.weight.medium,
                  color: theme.colors.text.default,
                }}
              >
                {assignee.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </MessageCard>
  );
};
