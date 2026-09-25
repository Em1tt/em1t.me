import { describe, expect, it } from 'vitest';
import data from '../../data/employees.json';
import { formatSalary, formatStartDate } from '../../src/format';

describe('formatSalary', () => {
  it('shows whole US dollars with thousands separators', () => {
    expect(formatSalary(123456)).toBe('$123,456');
    expect(formatSalary(62000)).toBe('$62,000');
    expect(formatSalary(999)).toBe('$999');
  });

  it('matches the specified formatter for every employee', () => {
    const reference = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
    for (const { salary } of data) expect(formatSalary(salary)).toBe(reference.format(salary));
  });
});

describe('formatStartDate', () => {
  it('shows the short month, day and year', () => {
    expect(formatStartDate('2021-03-04')).toBe('Mar 4, 2021');
    expect(formatStartDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('keeps the calendar date at the edges of the year', () => {
    expect(formatStartDate('2024-01-01')).toBe('Jan 1, 2024');
    expect(formatStartDate('2023-12-31')).toBe('Dec 31, 2023');
  });

  it('matches the specified formatter for every employee', () => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' } as const;
    for (const { startDate } of data) {
      expect(formatStartDate(startDate)).toBe(new Date(startDate).toLocaleDateString('en-US', options));
    }
  });
});
