import type { Employee } from '../../src/employee';

let nextId = 1;

/** An employee with plausible defaults; override just what a test cares about. */
export function employee(overrides: Partial<Employee> = {}): Employee {
  const id = overrides.id ?? nextId++;
  return {
    id,
    name: `Person ${id}`,
    email: `person.${id}@example.com`,
    department: 'Engineering',
    role: 'Software Engineer',
    salary: 100000,
    startDate: '2020-01-01',
    location: 'Remote',
    ...overrides,
  };
}

export const ids = (employees: readonly Employee[]): number[] => employees.map((e) => e.id);
