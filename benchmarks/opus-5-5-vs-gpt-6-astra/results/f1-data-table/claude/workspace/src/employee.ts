export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  /** Yearly salary in whole US dollars. */
  salary: number;
  /** Calendar date, `YYYY-MM-DD`. */
  startDate: string;
  location: string;
}

/** Every department that has employees, alphabetically. */
export function listDepartments(employees: readonly Employee[]): string[] {
  const departments = new Set(employees.map((employee) => employee.department));
  return [...departments].sort((a, b) => a.localeCompare(b, 'en'));
}
