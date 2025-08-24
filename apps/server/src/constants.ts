import { SENTIMENTS_ENUM } from "./ai/schemas";
import { TEXT_POSITION_ENUM } from "./types";

// Brand mention scoring configuration
const BRAND_MENTION_BASE_SCORE = 20;
const BRAND_MENTION_MULTIPLIER = 5;
const BRAND_MENTION_MIN_SCORE = 0;
const BRAND_MENTION_MAX_SCORE = 100;

// Text position weighting factors
const TEXT_POSITION_WEIGHTS = {
  [TEXT_POSITION_ENUM[0]]: 1.0, // Highest weight for mentions at start
  [TEXT_POSITION_ENUM[1]]: 0.3, // Lower weight for middle mentions
  [TEXT_POSITION_ENUM[2]]: 0.7, // Medium weight for end mentions
} as const;

// Sentiment impact multipliers
const SENTIMENT_MULTIPLIERS = {
  [SENTIMENTS_ENUM[0]]: 1.2, // Boost positive mentions
  [SENTIMENTS_ENUM[1]]: 1.0, // No impact for neutral
  [SENTIMENTS_ENUM[2]]: 0.8, // Reduce negative mentions
} as const;

const SENTIMENT_THRESHOLD = 0.2;
// Maximum bonus for attribute mentions
const ATTRIBUTE_BONUS_CAP = 0.1;

// Component weights for overall score calculation
const SCORE_COMPONENT_WEIGHTS = {
  mention: 0.3, // Brand mention frequency
  position: 0.2, // Text position importance
  sentiment: 0.3, // Sentiment impact
  competitive: 0.2, // Competitive context
} as const;

const COMPETITIVE_MULTIPLIER = 0.5;

export const BRAND_METRICS_CONFIG = {
  BRAND_MENTION_BASE_SCORE,
  BRAND_MENTION_MULTIPLIER,
  BRAND_MENTION_MIN_SCORE,
  BRAND_MENTION_MAX_SCORE,
  TEXT_POSITION_WEIGHTS,
  SENTIMENT_MULTIPLIERS,
  ATTRIBUTE_BONUS_CAP,
  SCORE_COMPONENT_WEIGHTS,
  SENTIMENT_THRESHOLD,
  COMPETITIVE_MULTIPLIER,
} as const;
