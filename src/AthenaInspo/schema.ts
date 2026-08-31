import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// Message types
export const UserMessageSchema = z.object({
  type: z.literal("user"),
  userName: z.string(),
  userAvatar: z.string().optional(),
  text: z.string(),
});

export const AIMessageSchema = z.object({
  type: z.literal("ai"),
  text: z.string(),
  showChart: z.boolean().optional(),
  chartData: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        color: z.string().optional(),
      })
    )
    .optional(),
  assignee: z
    .object({
      name: z.string(),
      avatar: z.string().optional(),
    })
    .optional(),
});

export const LoadingMessageSchema = z.object({
  type: z.literal("loading"),
  text: z.string(),
  icon: z.enum(["search", "process", "assign"]).optional(),
});

export const ActionMessageSchema = z.object({
  type: z.literal("action"),
  text: z.string(),
  icon: z.string().optional(),
  integrationBadge: z
    .object({
      name: z.string(),
      color: z.string(),
    })
    .optional(),
});

export const MessageSchema = z.discriminatedUnion("type", [
  UserMessageSchema,
  AIMessageSchema,
  LoadingMessageSchema,
  ActionMessageSchema,
]);

// Main composition schema
export const AthenaInspoSchema = z.object({
  // Branding
  brandName: z.string().default("Sia"),
  logoSrc: z.string().default("brand-assets/logo.svg"), // Path to logo image in public folder
  backgroundColor: zColor().default("#fffcfb"), // theme.colors.surface.viewport

  // Messages with timing
  messages: z.array(
    z.object({
      message: MessageSchema,
      startFrame: z.number(),
      durationFrames: z.number(),
      fadeToBackground: z.boolean().optional(),
    })
  ),
});

export type AthenaInspoProps = z.infer<typeof AthenaInspoSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type AIMessage = z.infer<typeof AIMessageSchema>;
export type LoadingMessage = z.infer<typeof LoadingMessageSchema>;
export type ActionMessage = z.infer<typeof ActionMessageSchema>;
