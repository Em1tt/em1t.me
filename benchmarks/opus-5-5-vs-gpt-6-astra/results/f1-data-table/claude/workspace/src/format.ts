const salaryFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  // Older engines reject maximumFractionDigits below the currency's default minimum of 2.
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const startDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // Date-only ISO strings parse as UTC midnight; formatting in UTC keeps the calendar date.
  timeZone: 'UTC',
});

/** `123456` → `$123,456` */
export function formatSalary(salary: number): string {
  return salaryFormat.format(salary);
}

/** `2021-03-04` → `Mar 4, 2021` */
export function formatStartDate(startDate: string): string {
  return startDateFormat.format(new Date(startDate));
}
