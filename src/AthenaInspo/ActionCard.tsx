import { MessageCard } from "./MessageCard";
import { BrandLogo } from "./BrandLogo";
import { theme } from "../theme";

interface ActionCardProps {
  text: string;
  entryDelay?: number;
  exitFrame?: number;
  integrationBadge?: {
    name: string;
    color: string;
  };
}

export const ActionCard: React.FC<ActionCardProps> = ({
  text,
  entryDelay = 0,
  exitFrame,
  integrationBadge,
}) => {
  return (
    <MessageCard entryDelay={entryDelay} exitFrame={exitFrame}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandLogo size={40} />
          <span
            style={{
              fontSize: 22,
              fontWeight: theme.typography.weight.medium,
              color: theme.colors.text.default,
            }}
          >
            {text}
          </span>
        </div>
        {integrationBadge && (
          <div
            style={{
              backgroundColor: integrationBadge.color,
              color: theme.colors.text.inverted,
              padding: "8px 12px",
              borderRadius: theme.layout.borderRadius.button,
              fontSize: theme.typography.size.body,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {integrationBadge.name[0].toUpperCase()}
          </div>
        )}
      </div>
    </MessageCard>
  );
};
