import type { Employee } from './employee';
import { formatSalary, formatStartDate } from './format';

export type ColumnKey = 'name' | 'email' | 'department' | 'role' | 'salary' | 'startDate' | 'location';

export interface Column {
  readonly key: ColumnKey;
  /** Header text. */
  readonly label: string;
  /** Numbers are right-aligned. */
  readonly numeric: boolean;
  /** The text a cell shows. */
  readonly format: (employee: Employee) => string;
  /** Orders two employees by this column, ascending; 0 when they tie. */
  readonly compare: (a: Employee, b: Employee) => number;
}

type TextKey = 'name' | 'email' | 'department' | 'role' | 'location';

// Orders exactly like `a.localeCompare(b, 'en')`, without setting up a collator per comparison.
const collator = new Intl.Collator('en');

function textColumn(key: TextKey, label: string): Column {
  return {
    key,
    label,
    numeric: false,
    format: (employee) => employee[key],
    compare: (a, b) => collator.compare(a[key], b[key]),
  };
}

/** The table's columns, in display order. */
export const COLUMNS: readonly Column[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  textColumn('department', 'Department'),
  textColumn('role', 'Role'),
  {
    key: 'salary',
    label: 'Salary',
    numeric: true,
    format: (employee) => formatSalary(employee.salary),
    compare: (a, b) => a.salary - b.salary,
  },
  {
    key: 'startDate',
    label: 'Start date',
    numeric: false,
    format: (employee) => formatStartDate(employee.startDate),
    compare: (a, b) => Date.parse(a.startDate) - Date.parse(b.startDate),
  },
  textColumn('location', 'Location'),
];

export function isColumnKey(value: unknown): value is ColumnKey {
  return COLUMNS.some((column) => column.key === value);
}

export function getColumn(key: ColumnKey): Column {
  const column = COLUMNS.find((candidate) => candidate.key === key);
  if (!column) throw new Error(`Unknown column: ${key}`);
  return column;
}
