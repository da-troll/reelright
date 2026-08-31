import { ChatSequence } from "../../../src/ChatSequence";
import { nextPlaygroundWidgetCatalog } from "../widgetCatalog";

export const NextPlaygroundChatWidgetStill: React.FC = () => (
  <ChatSequence
    backgroundColor="#f5f3ff"
    carouselMode={false}
    gradientFade={false}
    layout="desktop"
    logoPosition="bottom-left"
    showLogo={false}
    messages={[
      {
        chartInsight:
          "This card is imported from the active Next.js application.",
        chartType: "next-playground-product",
        delay: -30,
        isAi: true,
        userName: "Native app adapter",
      },
    ]}
    widgetCatalog={nextPlaygroundWidgetCatalog}
  />
);
