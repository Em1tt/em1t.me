// Writes the 500 employees for task F1, the same every time (seeded).
import { writeFileSync, mkdirSync } from 'node:fs';

function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const random = mulberry32(20260925);
const pick = (list) => list[Math.floor(random() * list.length)];

const first = ['Ana', 'Zoë', 'Łukasz', 'Chloé', 'Ömer', 'Élodie', 'Søren', 'Maria', 'James', 'Priya', 'Chen', 'Fatima', 'Liam', 'Noah', 'Olivia', 'Aisha', 'Mateo', 'Hana', 'Ivan', 'Sofia', 'Tomás', 'Emma', 'Kwame', 'Yuki', 'Lars', 'Nadia', 'Diego', 'Grace', 'Arjun', 'Mei', 'Oscar', 'Leila', 'Ben', 'anna', 'Dmitri', 'Eva', 'Hugo', 'Ines', 'Jonas', 'Kofi'];
const last = ['Smith', 'Núñez', 'Østergaard', "O'Brien", 'van der Berg', 'Kowalski', 'Nakamura', 'Okafor', 'Rossi', 'Schmidt', 'Haddad', 'Johansson', 'Patel', 'Garcia', 'Nguyen', 'Müller', 'Dubois', 'Silva', 'Kim', 'Ivanova', 'Brown', 'Lopez', 'de la Cruz', 'Andersen', 'Ahmed', 'Costa', 'Fischer', 'Mendes', 'Walker', 'Zhang'];
const departments = {
	Engineering: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager', 'QA Engineer'],
	Design: ['Product Designer', 'UX Researcher', 'Design Lead'],
	Sales: ['Account Executive', 'Sales Manager', 'Sales Engineer'],
	Marketing: ['Marketing Manager', 'Content Writer', 'SEO Specialist'],
	Finance: ['Accountant', 'Financial Analyst', 'Controller'],
	Support: ['Support Agent', 'Support Lead'],
	People: ['Recruiter', 'People Partner']
};
const locations = ['Berlin', 'Bratislava', 'Lisbon', 'New York', 'São Paulo', 'Tokyo', 'Toronto', 'Remote', 'Zürich', 'Nairobi'];

const plain = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^A-Za-z]/g, '').toLowerCase();
const used = new Map();
const employees = Array.from({ length: 500 }, (_, i) => {
	const f = pick(first);
	const l = pick(last);
	const department = pick(Object.keys(departments));
	const base = `${plain(f)}.${plain(l)}`;
	const n = (used.get(base) ?? 0) + 1;
	used.set(base, n);
	const start = new Date(Date.UTC(2012, 0, 1) + Math.floor(random() * (14.6 * 365)) * 86400000);
	return {
		id: i + 1,
		name: `${f} ${l}`,
		email: `${base}${n > 1 ? n : ''}@example.com`,
		department,
		role: pick(departments[department]),
		salary: 40000 + Math.round(random() * 180) * 1000 + (random() < 0.3 ? 500 : 0),
		startDate: start.toISOString().slice(0, 10),
		location: pick(locations)
	};
});

mkdirSync(new URL('./template/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('./template/data/employees.json', import.meta.url), JSON.stringify(employees, null, '\t') + '\n');
console.log(employees.length, 'employees;', new Set(employees.map((e) => e.department)).size, 'departments');
