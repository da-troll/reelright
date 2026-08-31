import { MessageCard } from "./MessageCard";
import { theme } from "../theme";

interface LoadingCardProps {
  text: string;
  icon?: "search" | "process" | "assign";
  entryDelay?: number;
  exitFrame?: number;
}

const SearchIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ProcessIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.9-2.9" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.9 2.9" />
    <path d="M12 18v4" />
    <path d="m4.9 19.1 2.9-2.9" />
    <path d="M2 12h4" />
    <path d="m4.9 4.9 2.9 2.9" />
  </svg>
);

const AssignIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const LoadingCard: React.FC<LoadingCardProps> = ({
  text,
  icon = "search",
  entryDelay = 0,
  exitFrame,
}) => {
  const IconComponent = {
    search: SearchIcon,
    process: ProcessIcon,
    assign: AssignIcon,
  }[icon];

  return (
    <MessageCard entryDelay={entryDelay} exitFrame={exitFrame}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: theme.colors.text.default,
        }}
      >
        <IconComponent />
        <span
          style={{
            fontSize: 22,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          {text}
        </span>
      </div>
    </MessageCard>
  );
};
