export type SkinName = 'clean' | 'sketch';
const SKIN_NAME_SET: Set<SkinName> = new Set(['clean', 'sketch']);

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
    dasharray?: string;
    linecap?: 'butt' | 'round' | 'square';
  };
  shadows: {
    card: ShadowToken;
  };
  jitter: {
    enabled: boolean;
    amplitude: number;
    seedOffset: number;
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
  jitter?: Partial<SkinTokens['jitter']>;
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
    linecap: 'butt',
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
  jitter: {
    enabled: false,
    amplitude: 0,
    seedOffset: 0.4,
  },
};

export const SKETCH_SKIN_TOKENS: SkinTokens = {
  name: 'sketch',
  palette: {
    ...CLEAN_SKIN_TOKENS.palette,
    canvas: '#FFFBF0',
    surface: '#FFFDF7',
    surfaceAlt: '#FEF3C7',
    stroke: '#D4A373',
    mutedStroke: '#FDE68A',
  },
  radii: {
    ...CLEAN_SKIN_TOKENS.radii,
  },
  typography: {
    ...CLEAN_SKIN_TOKENS.typography,
  },
  stroke: {
    width: 1.5,
    dasharray: '8 5',
    linecap: 'round',
  },
  shadows: {
    card: {
      dx: 0,
      dy: 4,
      blur: 10,
      spread: 0,
      color: '#78350F',
      opacity: 0.08,
    },
  },
  jitter: {
    enabled: true,
    amplitude: 1.4,
    seedOffset: 0.6,
  },
};

export function resolveSkinTokens(settings?: SkinSettings): SkinTokens {
  const name = settings?.name ?? 'clean';
  const base = name === 'sketch' ? SKETCH_SKIN_TOKENS : CLEAN_SKIN_TOKENS;
  const tokens = cloneSkinTokens(base);

  if (settings?.overrides) {
    return mergeSkinTokens(tokens, settings.overrides);
  }

  return tokens;
}

export function skinSettingsFromGlobals(
  globals?: Record<string, unknown>,
): SkinSettings | undefined {
  if (!globals) {
    return undefined;
  }

  const overrides: SkinTokensOverride = {};
  let overrideCount = 0;

  const skinValue = typeof globals.skin === 'string' ? globals.skin.toLowerCase() : undefined;
  const name = skinValue && isSkinName(skinValue) ? (skinValue as SkinName) : undefined;

  for (const [key, value] of Object.entries(globals)) {
    if (key.startsWith('color.')) {
      const paletteKey = key.slice(6);
      if (isPaletteKey(paletteKey) && typeof value === 'string') {
        overrides.palette = { ...overrides.palette, [paletteKey]: value };
        overrideCount++;
      }
      continue;
    }

    if (key.startsWith('radius.')) {
      const radiusKey = mapRadiusKey(key.slice(7));
      if (radiusKey && typeof value === 'number') {
        overrides.radii = { ...overrides.radii, [radiusKey]: value };
        overrideCount++;
      }
      continue;
    }

    if (key.startsWith('stroke.')) {
      const strokeKey = key.slice(7);
      if (isStrokeKey(strokeKey)) {
        if (strokeKey === 'width' && typeof value === 'number') {
          overrides.stroke = { ...overrides.stroke, width: value };
          overrideCount++;
        } else if (strokeKey === 'dasharray' && typeof value === 'string') {
          overrides.stroke = { ...overrides.stroke, dasharray: value };
          overrideCount++;
        } else if (strokeKey === 'dash' && typeof value === 'string') {
          overrides.stroke = { ...overrides.stroke, dasharray: value };
          overrideCount++;
        } else if (strokeKey === 'linecap' && typeof value === 'string') {
          overrides.stroke = { ...overrides.stroke, linecap: value as SkinTokens['stroke']['linecap'] };
          overrideCount++;
        }
      }
      continue;
    }

    if (key.startsWith('shadow.')) {
      const shadowParts = key.split('.');
      if (shadowParts.length === 2 && shadowParts[1] === 'card' && typeof value === 'string') {
        const preset = resolveShadowPreset(value);
        if (preset) {
          overrides.shadows = {
            ...overrides.shadows,
            card: { ...preset },
          };
          overrideCount++;
        }
        continue;
      }
      if (shadowParts.length === 3 && shadowParts[1] === 'card') {
        const prop = shadowParts[2];
        if (!prop) {
          continue;
        }
        const isColorProp = prop === 'color';
        if (isShadowProp(prop)) {
          if (!isColorProp && typeof value !== 'number') {
            continue;
          }
          if (isColorProp && typeof value !== 'string') {
            continue;
          }
          const nextCard = {
            ...(overrides.shadows?.card ?? {}),
            [prop]: value,
          } as Partial<ShadowToken>;
          overrides.shadows = {
            ...overrides.shadows,
            card: nextCard,
          };
          overrideCount++;
        }
        continue;
      }
    }

    if (key === 'font' && typeof value === 'string') {
      overrides.typography = { ...overrides.typography, fontFamily: value };
      overrideCount++;
    }
  }

  if (!name && overrideCount === 0) {
    return undefined;
  }

  return {
    name,
    overrides: overrideCount > 0 ? overrides : undefined,
  };
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
    jitter: { ...tokens.jitter },
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
  if (overrides.jitter) {
    tokens.jitter = { ...tokens.jitter, ...overrides.jitter };
  }

  return tokens;
}

function isSkinName(value: string): value is SkinName {
  return SKIN_NAME_SET.has(value as SkinName);
}

type PaletteKey = keyof SkinTokens['palette'];
const PALETTE_KEYS = new Set<PaletteKey>(
  Object.keys(CLEAN_SKIN_TOKENS.palette) as PaletteKey[],
);

function isPaletteKey(value: string): value is PaletteKey {
  return PALETTE_KEYS.has(value as PaletteKey);
}

type RadiusKey = keyof SkinTokens['radii'];
const RADIUS_KEY_MAP: Record<string, RadiusKey> = {
  card: 'card',
  control: 'control',
  ctrl: 'control',
  pill: 'pill',
};

function mapRadiusKey(value: string): RadiusKey | undefined {
  const normalized = value.toLowerCase();
  return RADIUS_KEY_MAP[normalized as keyof typeof RADIUS_KEY_MAP];
}

type StrokeKey = keyof SkinTokens['stroke'] | 'dash';
const STROKE_KEYS = new Set<StrokeKey>(['width', 'dasharray', 'linecap', 'dash']);

function isStrokeKey(value: string): value is StrokeKey {
  return STROKE_KEYS.has(value as StrokeKey);
}

type ShadowProp = keyof ShadowToken;
const SHADOW_PROPS = new Set<ShadowProp>(['dx', 'dy', 'blur', 'spread', 'color', 'opacity']);

function isShadowProp(value: string): value is ShadowProp {
  return SHADOW_PROPS.has(value as ShadowProp);
}

const SHADOW_PRESETS: Record<string, ShadowToken> = {
  soft: { dx: 0, dy: 8, blur: 16, spread: 0, color: '#0F172A', opacity: 0.12 },
  medium: { dx: 0, dy: 12, blur: 24, spread: 0, color: '#0F172A', opacity: 0.16 },
  hard: { dx: 0, dy: 16, blur: 32, spread: 0, color: '#0F172A', opacity: 0.2 },
  none: { dx: 0, dy: 0, blur: 0, spread: 0, color: '#000000', opacity: 0 },
};

function resolveShadowPreset(value: string): ShadowToken | undefined {
  const preset = SHADOW_PRESETS[value.toLowerCase()];
  return preset ? { ...preset } : undefined;
}
