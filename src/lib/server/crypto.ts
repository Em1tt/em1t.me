// Hashing that runs the same in the Worker and under `vite dev`: both have Web Crypto.

const encoder = new TextEncoder();
const hex = (buffer: ArrayBuffer) =>
	[...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export const sha256 = async (value: string) =>
	hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

export async function hmac(key: string, value: string) {
	const secret = await crypto.subtle.importKey(
		'raw',
		encoder.encode(key),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return hex(await crypto.subtle.sign('HMAC', secret, encoder.encode(value)));
}

/** 32 random bytes, base64url: a session cookie's value. */
export function randomToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

/** Compares two strings in constant time, for passwords. Hashing first evens out the lengths. */
export async function sameString(a: string, b: string) {
	const [x, y] = await Promise.all(
		[a, b].map(
			async (value) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
		)
	);
	let difference = 0;
	for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
	return difference === 0;
}
