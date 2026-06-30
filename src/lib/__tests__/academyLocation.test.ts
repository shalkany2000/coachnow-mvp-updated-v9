import { describe, it, expect } from 'vitest';
import { formatAcademyLocation, buildAcademyLocationSearchText, AcademyLocation } from '../mockData';

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
