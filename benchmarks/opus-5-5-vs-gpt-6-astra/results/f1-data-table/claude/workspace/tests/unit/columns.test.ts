import { describe, expect, it } from 'vitest';
import { COLUMNS, getColumn, isColumnKey } from '../../src/columns';
import { listDepartments } from '../../src/employee';
import { employee } from './fixtures';

describe('COLUMNS', () => {
  it('lists the columns in display order', () => {
    expect(COLUMNS.map(({ key, label }) => [key, label])).toEqual([
      ['name', 'Name'],
      ['email', 'Email'],
      ['department', 'Department'],
      ['role', 'Role'],
      ['salary', 'Salary'],
      ['startDate', 'Start date'],
      ['location', 'Location'],
    ]);
  });

  it('formats each cell', () => {
    const person = employee({
      name: "Zoë O'Brien",
      email: 'zoe.obrien@example.com',
      department: 'Design',
      role: 'Design Lead',
      salary: 123456,
      startDate: '2021-03-04',
      location: 'Zürich',
    });
    expect(COLUMNS.map((column) => column.format(person))).toEqual([
      "Zoë O'Brien",
      'zoe.obrien@example.com',
      'Design',
      'Design Lead',
      '$123,456',
      'Mar 4, 2021',
      'Zürich',
    ]);
  });

  it('compares text like localeCompare in English', () => {
    const { compare } = getColumn('name');
    const pairs: [string, string][] = [
      ['anna Andersen', 'Anna Andersen'],
      ['anna Andersen', 'Ben Mendes'],
      ['Ömer Schmidt', 'Oscar Smith'],
      ['Łukasz Andersen', 'Lars Garcia'],
      ['Zoë Haddad', 'Zoe Haddad'],
    ];
    for (const [a, b] of pairs) {
      const expected = Math.sign(a.localeCompare(b, 'en'));
      expect(Math.sign(compare(employee({ name: a }), employee({ name: b })))).toBe(expected);
      expect(Math.sign(compare(employee({ name: b }), employee({ name: a })))).toBe(-expected);
    }
  });

  it('compares salaries as numbers and start dates chronologically', () => {
    const salary = getColumn('salary').compare;
    expect(salary(employee({ salary: 9000 }), employee({ salary: 62000 }))).toBeLessThan(0);
    expect(salary(employee({ salary: 62000 }), employee({ salary: 62000 }))).toBe(0);

    const startDate = getColumn('startDate').compare;
    expect(startDate(employee({ startDate: '2019-12-31' }), employee({ startDate: '2020-01-01' }))).toBeLessThan(0);
    expect(startDate(employee({ startDate: '2021-06-16' }), employee({ startDate: '2021-06-16' }))).toBe(0);
  });
});

describe('isColumnKey', () => {
  it('accepts column keys only', () => {
    expect(isColumnKey('startDate')).toBe(true);
    expect(isColumnKey('id')).toBe(false);
    expect(isColumnKey('Name')).toBe(false);
    expect(isColumnKey(null)).toBe(false);
  });
});

describe('listDepartments', () => {
  it('lists each department once, alphabetically', () => {
    const employees = ['Sales', 'Design', 'Sales', 'Engineering', 'Design'].map((department) =>
      employee({ department }),
    );
    expect(listDepartments(employees)).toEqual(['Design', 'Engineering', 'Sales']);
  });
});
