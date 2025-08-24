export const TEXT_POSITION_ENUM = ["start", "middle", "end"] as const;
export type TextPosition = (typeof TEXT_POSITION_ENUM)[number];
export const INSIGHT_EVENT_TYPES = [
  "brand_detection",
  "attribute_detection",
] as const;

export type InsightEventType = (typeof INSIGHT_EVENT_TYPES)[number];

export const SENTIMENTS_ENUM = ["positive", "neutral", "negative"] as const;
export type Sentiment = (typeof SENTIMENTS_ENUM)[number];
