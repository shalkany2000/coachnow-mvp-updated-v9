import { describe, it, expect } from 'vitest';
import { isMapLink, buildMapLink } from '../config';

describe('isMapLink', () => {
  it('recognizes real Google Maps share link formats', () => {
    expect(isMapLink('https://maps.app.goo.gl/Xy7zAbC123')).toBe(true);
    expect(isMapLink('https://www.google.com/maps/place/Dubai+Marina/@25.0,55.1,15z')).toBe(true);
    expect(isMapLink('https://goo.gl/maps/Xy7zAbC')).toBe(true);
  });

  it('treats a plain typed address as not a link', () => {
    expect(isMapLink('Villa 12, Street 4, Al Barsha, Dubai')).toBe(false);
  });

  it('handles surrounding whitespace from copy-paste', () => {
    expect(isMapLink('  https://maps.app.goo.gl/test  ')).toBe(true);
  });

  it('treats an empty string as not a link', () => {
    expect(isMapLink('')).toBe(false);
  });
});

describe('buildMapLink', () => {
  it('uses a real pasted link directly, unmodified', () => {
    const link = 'https://maps.app.goo.gl/Xy7zAbC123';
    expect(buildMapLink(link)).toBe(link);
  });

  it('wraps a typed address in a Maps text search', () => {
    const result = buildMapLink('Villa 12, Al Barsha, Dubai');
    expect(result).toContain('google.com/maps/search');
    expect(result).toContain(encodeURIComponent('Villa 12, Al Barsha, Dubai'));
  });

  it('trims whitespace from a pasted link before using it', () => {
    const result = buildMapLink('  https://maps.app.goo.gl/test  ');
    expect(result).toBe('https://maps.app.goo.gl/test');
  });
});
