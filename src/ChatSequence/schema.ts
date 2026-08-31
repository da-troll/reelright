import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const ChatMessageSchema = z.object({
  text: z.string().optional(),
  isAi: z.boolean(),
  delay: z.number(), // Frame delay before this message appears
  userName: z.string().optional(),
  userAvatar: z.string().optional(), // Path to user avatar image (relative to public/)
  reasoningSteps: z.array(z.string()).optional(),
  showChart: z.boolean().optional(), // Flag to show chart widget (legacy, uses joiners-leavers)
  // Insight text displayed below chart widget in message bubble
  // Can be a single string (paragraph) or object with heading + numbered list
  chartInsight: z
    .union([
      z.string(),
      z.object({
        heading: z.string(),
        items: z.array(z.string()),
      }),
    ])
    .optional(),
  // Catalog keys are extensible by an active native-app adapter.
  chartType: z.string().optional(),
});

export const ChatSequenceSchema = z.object({
  backgroundColor: zColor().default("#fffcfb"),
  backgroundImage: z.string().optional(),
  logoPosition: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .optional()
    .default("bottom-left"),
  showLogo: z.boolean().optional().default(false),
  carouselMode: z.boolean().optional().default(false), // When true, older messages fade out as new ones appear
  gradientFade: z.boolean().optional().default(false), // When true, adds gradient overlay that fades messages towards top
  layout: z.enum(["desktop", "mobile"]).optional().default("mobile"), // Desktop: 4K right-aligned scaled, Mobile: portrait centered
  messages: z.array(ChatMessageSchema),
});

export type ChatSequenceProps = z.infer<typeof ChatSequenceSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
