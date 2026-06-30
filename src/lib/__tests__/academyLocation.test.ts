import { describe, it, expect } from 'vitest';
import { formatAcademyLocation, buildAcademyLocationSearchText, normalizeAcademyLocations, AcademyLocation } from '../mockData';

describe('formatAcademyLocation', () => {
  it('formats area and emirate without extra detail', () => {
    const loc: AcademyLocation = { emirate: 'Dubai', area: 'Dubai Marina' };
    expect(formatAcademyLocation(loc)).toBe('Dubai Marina, Dubai');
  });

  it('appends address detail when present', () => {
    const loc: AcademyLocation = { emirate: 'Dubai', area: 'JBR', addressDetail: 'Bahar Building 3' };
    expect(formatAcademyLocation(loc)).toBe('JBR, Dubai — Bahar Building 3');
  });

  it('formats a custom "Other" area the same way as a listed one', () => {
    const loc: AcademyLocation = { emirate: 'Sharjah', area: 'Al Suyoh' };
    expect(formatAcademyLocation(loc)).toBe('Al Suyoh, Sharjah');
  });

  it('omits the leading comma when area is empty (legacy-data fallback case)', () => {
    const loc: AcademyLocation = { emirate: 'Dubai', area: '', addressDetail: 'Dubai Marina Branch, Dubai' };
    expect(formatAcademyLocation(loc)).toBe('Dubai — Dubai Marina Branch, Dubai');
  });
});

describe('buildAcademyLocationSearchText', () => {
  it('uses addressDetail when present, since it is more precise', () => {
    const loc: AcademyLocation = { emirate: 'Dubai', area: 'Dubai Marina', addressDetail: 'https://maps.app.goo.gl/xyz' };
    expect(buildAcademyLocationSearchText(loc)).toBe('https://maps.app.goo.gl/xyz');
  });

  it('falls back to area + emirate + UAE when no detail is given', () => {
    const loc: AcademyLocation = { emirate: 'Abu Dhabi', area: 'Yas Island' };
    expect(buildAcademyLocationSearchText(loc)).toBe('Yas Island, Abu Dhabi, UAE');
  });
});

describe('normalizeAcademyLocations', () => {
  it('passes through already-structured locations unchanged', () => {
    const input = [{ emirate: 'Dubai', area: 'JBR', addressDetail: 'Bldg 3' }];
    expect(normalizeAcademyLocations(input)).toEqual(input);
  });

  it('converts a legacy plain-string location into the structured shape', () => {
    // This is exactly the format locations were saved in before the
    // emirate/area dropdown existed — must not crash or produce an
    // unusable entry, since real academies already have data like this.
    const result = normalizeAcademyLocations(['Dubai Marina Branch, Dubai']);
    expect(result).toEqual([{ emirate: 'Dubai', area: '', addressDetail: 'Dubai Marina Branch, Dubai' }]);
  });

  it('handles a mix of legacy strings and structured entries in the same array', () => {
    const result = normalizeAcademyLocations([
      'Old text location',
      { emirate: 'Sharjah', area: 'Al Majaz' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].addressDetail).toBe('Old text location');
    expect(result[1]).toEqual({ emirate: 'Sharjah', area: 'Al Majaz' });
  });

  it('returns an empty array for missing or non-array input, never throwing', () => {
    expect(normalizeAcademyLocations(undefined)).toEqual([]);
    expect(normalizeAcademyLocations(null)).toEqual([]);
    expect(normalizeAcademyLocations('not an array')).toEqual([]);
  });
});
