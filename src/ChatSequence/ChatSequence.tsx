import { AbsoluteFill, Img, staticFile } from "remotion";
import { MessageBubble } from "./MessageBubble";
import { theme } from "../theme";
import { mergeWidgetCatalogs, type WidgetCatalog } from "../widgets/catalog";
import type { ChatSequenceProps, ChatMessage } from "./schema";
import { builtInChatWidgetCatalog } from "./widgetCatalog";

type ChatSequenceRuntimeProps = ChatSequenceProps & {
  widgetCatalog?: WidgetCatalog;
};

const MissingWidget: React.FC<{ widgetType: string }> = ({ widgetType }) => (
  <div
    role="alert"
    style={{
      backgroundColor: "#fff1f0",
      border: "2px solid #d92d20",
      borderRadius: 8,
      color: "#912018",
      fontFamily: "monospace",
      fontSize: 16,
      fontWeight: 600,
      padding: 16,
    }}
  >
    Unknown widget: {widgetType}
  </div>
);

const getChartWidget = (
  message: ChatMessage,
  layout: "desktop" | "mobile",
  widgetCatalog: WidgetCatalog,
): React.ReactNode | undefined => {
  const widgetType =
    message.chartType ?? (message.showChart ? "joiners-leavers" : undefined);

  if (!widgetType) {
    return undefined;
  }

  const Widget = widgetCatalog[widgetType];

  return Widget ? (
    <Widget layout={layout} />
  ) : (
    <MissingWidget widgetType={widgetType} />
  );
};

// Calculate carousel mode timing for a message
// - Most recent (1st): fully visible
// - 2nd last: fully visible
// - 3rd last: faded to background
// - 4th last: exits/disappears
const getCarouselTiming = (
  messages: ChatMessage[],
  index: number,
): { fadeToBackgroundFrame?: number; exitFrame?: number } => {
  const currentMsg = messages[index];
  const msg2After = messages[index + 2]; // When this appears, current becomes 3rd last
  const msg3After = messages[index + 3]; // When this appears, current becomes 4th last

  // Fade to background when becoming 3rd last message
  const fadeToBackgroundFrame = msg2After
    ? msg2After.delay - currentMsg.delay - 10
    : undefined;

  // Exit when becoming 4th last message
  const exitFrame = msg3After
    ? msg3After.delay - currentMsg.delay - 10
    : undefined;

  return { fadeToBackgroundFrame, exitFrame };
};

// Layout configuration for desktop vs mobile
const layoutConfig = {
  desktop: {
    // 4K (3840×2160) - scale 2.8x for prominent chat display
    // Messages centered between logo end and right edge
    scale: 2.8,
    align: "center" as const,
    transformOrigin: "center bottom",
    containerPadding: { top: 0, left: 1150, right: 160, bottom: 320 },
    logoHeight: 160,
    logoOffset: 100,
    maxWidth: 800, // Base width before scaling (800 * 2.8 = 2240px effective)
  },
  mobile: {
    // Portrait (1440×2560) - scale 2.5x for phone-like chat appearance
    scale: 2.5,
    align: "center" as const,
    transformOrigin: "center bottom",
    containerPadding: { top: 0, left: 80, right: 80, bottom: 280 },
    logoHeight: 140,
    logoOffset: 80,
    maxWidth: 480, // Smaller base width, scales to ~1200px effective
  },
};

export const ChatSequence: React.FC<ChatSequenceRuntimeProps> = ({
  backgroundColor,
  backgroundImage,
  logoPosition = "bottom-left",
  showLogo = false,
  carouselMode = false,
  gradientFade = false,
  layout = "mobile",
  messages,
  widgetCatalog,
}) => {
  const config = layoutConfig[layout];
  const widgets = mergeWidgetCatalogs(
    builtInChatWidgetCatalog,
    widgetCatalog ?? {},
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backgroundColor || theme.colors.surface.viewport,
      }}
    >
      {backgroundImage && (
        <Img
          src={staticFile(backgroundImage)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
      )}

      {/* Brand logo - always visible above everything */}
      {showLogo ? (
        <Img
          src={staticFile(
            "brand-assets/logo.svg", // Provide your own asset under public/
          )}
          style={{
            position: "absolute",
            top: logoPosition.startsWith("top") ? config.logoOffset : undefined,
            bottom: logoPosition.startsWith("bottom")
              ? config.logoOffset
              : undefined,
            left: logoPosition.endsWith("left") ? config.logoOffset : undefined,
            right: logoPosition.endsWith("right")
              ? config.logoOffset
              : undefined,
            height: config.logoHeight,
            zIndex: 100,
          }}
        />
      ) : null}

      {/*
        Messages container - stays above logo area
        overflow: hidden clips any content that would extend into logo zone
      */}
      <div
        style={{
          position: "absolute",
          top: config.containerPadding.top,
          left: config.containerPadding.left,
          right: config.containerPadding.right,
          bottom: config.containerPadding.bottom,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: config.align,
          overflow: "hidden",
          zIndex: 1,
          // Gradient fade: 60% opacity at top, full visibility from 20% down
          ...(gradientFade && {
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,1) 20%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,1) 20%)",
          }),
        }}
      >
        {/* Inner container with transform scaling */}
        <div
          style={{
            width: "100%",
            maxWidth: config.maxWidth,
            display: "flex",
            flexDirection: "column",
            transform: `scale(${config.scale})`,
            transformOrigin: config.transformOrigin,
          }}
        >
          {messages.map((msg, index) => {
            const carouselTiming = carouselMode
              ? getCarouselTiming(messages, index)
              : {};

            return (
              <MessageBubble
                key={index}
                text={msg.text}
                isAi={msg.isAi}
                delay={msg.delay}
                userName={msg.userName}
                userAvatar={msg.userAvatar}
                reasoningSteps={msg.reasoningSteps}
                chartWidget={getChartWidget(msg, layout, widgets)}
                chartInsight={msg.chartInsight}
                fadeToBackgroundFrame={carouselTiming.fadeToBackgroundFrame}
                exitFrame={carouselTiming.exitFrame}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
