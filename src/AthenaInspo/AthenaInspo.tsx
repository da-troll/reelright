import { AbsoluteFill, Sequence } from "remotion";
import { ChatWindow } from "./ChatWindow";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { LoadingCard } from "./LoadingCard";
import { ActionCard } from "./ActionCard";
import { ChartCard } from "./ChartCard";
import type { AthenaInspoProps, Message } from "./schema";

export const AthenaInspo: React.FC<AthenaInspoProps> = ({
  brandName,
  logoSrc,
  backgroundColor,
  messages,
}) => {
  return (
    <ChatWindow backgroundColor={backgroundColor}>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {messages.map((item, index) => {
          const { message, startFrame, durationFrames, fadeToBackground } = item;

          // Calculate fade to background frame if needed
          const nextMessage = messages[index + 1];
          const fadeToBackgroundFrame =
            fadeToBackground && nextMessage
              ? nextMessage.startFrame - 10
              : undefined;

          // Calculate exit frame
          const exitFrame = startFrame + durationFrames - 15;

          return (
            <Sequence
              key={index}
              from={startFrame}
              durationInFrames={durationFrames}
              layout="none"
            >
              {renderMessage(message, {
                brandName,
                logoSrc,
                fadeToBackgroundFrame: fadeToBackgroundFrame
                  ? fadeToBackgroundFrame - startFrame
                  : undefined,
                exitFrame: exitFrame - startFrame,
              })}
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </ChatWindow>
  );
};

interface RenderOptions {
  brandName: string;
  logoSrc?: string;
  fadeToBackgroundFrame?: number;
  exitFrame?: number;
}

function renderMessage(message: Message, options: RenderOptions) {
  const { brandName, logoSrc, fadeToBackgroundFrame, exitFrame } = options;

  switch (message.type) {
    case "user":
      return (
        <UserMessage
          userName={message.userName}
          userAvatar={message.userAvatar}
          text={message.text}
          fadeToBackgroundFrame={fadeToBackgroundFrame}
          exitFrame={exitFrame}
        />
      );

    case "ai":
      return (
        <AIMessage
          brandName={brandName}
          logoSrc={logoSrc}
          text={message.text}
          exitFrame={exitFrame}
          assignee={message.assignee}
        >
          {message.showChart && message.chartData && (
            <ChartCard
              data={message.chartData}
              entryDelay={10}
            />
          )}
        </AIMessage>
      );

    case "loading":
      return (
        <LoadingCard
          text={message.text}
          icon={message.icon}
          exitFrame={exitFrame}
        />
      );

    case "action":
      return (
        <ActionCard
          text={message.text}
          exitFrame={exitFrame}
          integrationBadge={message.integrationBadge}
        />
      );

    default:
      return null;
  }
}
