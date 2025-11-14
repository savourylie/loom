export type SkinName = 'clean';

export interface ShadowToken {
  dx: number;
  dy: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

export interface SkinTokens {
  name: SkinName;
  palette: {
    canvas: string;
    surface: string;
    surfaceAlt: string;
    stroke: string;
    mutedStroke: string;
    text: string;
    textMuted: string;
    brand: string;
    primary: string;
    danger: string;
    ghostSurface: string;
    icon: string;
    placeholder: string;
    focus: string;
  };
  radii: {
    card: number;
    control: number;
    pill: number;
  };
  typography: {
    fontFamily: string;
    baseSize: number;
    buttonSize: number;
    lineHeight: number;
    weightRegular: number;
    weightBold: number;
  };
  stroke: {
    width: number;
  };
  shadows: {
    card: ShadowToken;
  };
}

export type SkinTokensOverride = {
  palette?: Partial<SkinTokens['palette']>;
  radii?: Partial<SkinTokens['radii']>;
  typography?: Partial<SkinTokens['typography']>;
  stroke?: Partial<SkinTokens['stroke']>;
  shadows?: {
    card?: Partial<SkinTokens['shadows']['card']>;
  };
};

export interface SkinSettings {
  name?: SkinName;
  overrides?: SkinTokensOverride;
}

export const CLEAN_SKIN_TOKENS: SkinTokens = {
  name: 'clean',
  palette: {
    canvas: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    stroke: '#E2E8F0',
    mutedStroke: '#CBD5F5',
    text: '#0F172A',
    textMuted: '#475569',
    brand: '#6D28D9',
    primary: '#2563EB',
    danger: '#DC2626',
    ghostSurface: '#EEF2FF',
    icon: '#334155',
    placeholder: '#94A3B8',
    focus: '#7C3AED',
  },
  radii: {
    card: 12,
    control: 8,
    pill: 999,
  },
  typography: {
    fontFamily:
      'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    baseSize: 14,
    buttonSize: 15,
    lineHeight: 1.4,
    weightRegular: 500,
    weightBold: 600,
  },
  stroke: {
    width: 1,
  },
  shadows: {
    card: {
      dx: 0,
      dy: 8,
      blur: 16,
      spread: 0,
      color: '#0F172A',
      opacity: 0.12,
    },
  },
};

export function resolveSkinTokens(settings?: SkinSettings): SkinTokens {
  const name = settings?.name ?? 'clean';
  const base = name === 'clean' ? CLEAN_SKIN_TOKENS : CLEAN_SKIN_TOKENS;
  const tokens = cloneSkinTokens(base);

  if (settings?.overrides) {
    return mergeSkinTokens(tokens, settings.overrides);
  }

  return tokens;
}

function cloneSkinTokens(tokens: SkinTokens): SkinTokens {
  return {
    ...tokens,
    palette: { ...tokens.palette },
    radii: { ...tokens.radii },
    typography: { ...tokens.typography },
    stroke: { ...tokens.stroke },
    shadows: {
      card: { ...tokens.shadows.card },
    },
  };
}

function mergeSkinTokens(tokens: SkinTokens, overrides: SkinTokensOverride): SkinTokens {
  if (overrides.palette) {
    tokens.palette = { ...tokens.palette, ...overrides.palette };
  }
  if (overrides.radii) {
    tokens.radii = { ...tokens.radii, ...overrides.radii };
  }
  if (overrides.typography) {
    tokens.typography = { ...tokens.typography, ...overrides.typography };
  }
  if (overrides.stroke) {
    tokens.stroke = { ...tokens.stroke, ...overrides.stroke };
  }
  if (overrides.shadows?.card) {
    tokens.shadows = {
      ...tokens.shadows,
      card: { ...tokens.shadows.card, ...overrides.shadows.card },
    };
  }

  return tokens;
}
