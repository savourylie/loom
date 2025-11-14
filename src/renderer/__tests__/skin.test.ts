import { describe, expect, it } from 'vitest';
import { resolveSkinTokens, skinSettingsFromGlobals } from '../skin.js';

describe('skin tokens', () => {
  it('derives skin + overrides from style globals', () => {
    const globals = {
      skin: 'sketch',
      'color.brand': '#E63946',
      'radius.ctrl': 6,
      'stroke.width': 2,
      'shadow.card': 'hard',
    };

    const settings = skinSettingsFromGlobals(globals)!;
    expect(settings.name).toBe('sketch');
    expect(settings.overrides?.palette?.brand).toBe('#E63946');
    expect(settings.overrides?.radii?.control).toBe(6);

    const tokens = resolveSkinTokens(settings);
    expect(tokens.name).toBe('sketch');
    expect(tokens.palette.brand).toBe('#E63946');
    expect(tokens.radii.control).toBe(6);
    expect(tokens.stroke.width).toBe(2);
    expect(tokens.shadows.card.blur).toBeGreaterThan(0);
  });

  it('applies overrides even when skin name is unknown', () => {
    const settings = skinSettingsFromGlobals({
      skin: 'retro',
      'stroke.dasharray': '4 2',
    })!;
    expect(settings.name).toBeUndefined();

    const tokens = resolveSkinTokens(settings);
    expect(tokens.name).toBe('clean');
    expect(tokens.stroke.dasharray).toBe('4 2');
  });

  it('returns undefined when no globals are provided', () => {
    expect(skinSettingsFromGlobals(undefined)).toBeUndefined();
  });
});
