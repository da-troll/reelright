import { Avatar } from "./Avatar";
import { MessageCard } from "./MessageCard";
import { theme } from "../theme";

interface UserMessageProps {
  userName: string;
  userAvatar?: string;
  text: string;
  entryDelay?: number;
  fadeToBackgroundFrame?: number;
  exitFrame?: number;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  userName,
  userAvatar,
  text,
  entryDelay = 0,
  fadeToBackgroundFrame,
  exitFrame,
}) => {
  return (
    <MessageCard
      entryDelay={entryDelay}
      fadeToBackgroundFrame={fadeToBackgroundFrame}
      exitFrame={exitFrame}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <Avatar src={userAvatar} name={userName} size={44} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: theme.typography.size.body,
              fontWeight: theme.typography.weight.medium,
              color: theme.colors.text.secondary,
              marginBottom: 6,
            }}
          >
            {userName}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: theme.typography.weight.regular,
              color: theme.colors.text.default,
              lineHeight: 1.4,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </MessageCard>
  );
};
