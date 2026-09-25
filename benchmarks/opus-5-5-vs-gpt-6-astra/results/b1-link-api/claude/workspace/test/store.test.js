import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LinkStore, openDatabase } from '../src/store.js';

function storeWithClock(startTime = Date.parse('2026-09-25T10:00:00.000Z')) {
  const clock = { now: startTime };
  const db = openDatabase(':memory:');
  return { clock, db, store: new LinkStore(db, { now: () => clock.now }) };
}

describe('LinkStore', () => {
  it('creates links with the clock time', () => {
    const { store } = storeWithClock();
    assert.deepEqual(store.create('https://example.com/docs', 'docs'), {
      slug: 'docs',
      url: 'https://example.com/docs',
      createdAt: '2026-09-25T10:00:00.000Z',
      clicks: 0,
    });
    assert.equal(store.create('https://example.com/other', 'docs'), null);
    assert.equal(store.get('docs').url, 'https://example.com/docs');
  });

  it('generates distinct 7-character alphanumeric slugs', () => {
    const { store } = storeWithClock();
    const slugs = new Set();
    for (let i = 0; i < 500; i++) {
      const { slug } = store.create('https://example.com');
      assert.match(slug, /^[A-Za-z0-9]{7}$/);
      slugs.add(slug);
    }
    assert.equal(slugs.size, 500);
  });

  it('counts clicks per UTC day for the last 7 days', () => {
    const { clock, store } = storeWithClock(Date.parse('2026-09-18T12:00:00.000Z'));
    store.create('https://example.com', 'docs');

    const clickAt = (iso, times = 1) => {
      clock.now = Date.parse(iso);
      for (let i = 0; i < times; i++) assert.equal(store.recordClick('docs'), 'https://example.com');
    };
    clickAt('2026-09-18T23:59:59.999Z', 5); // 7 days ago: counted in the total only
    clickAt('2026-09-19T00:00:00.000Z', 2); // 6 days ago: the first day shown
    clickAt('2026-09-22T13:30:00.000Z');
    clickAt('2026-09-25T00:00:00.000Z');
    clickAt('2026-09-25T23:59:59.999Z', 3);

    assert.deepEqual(store.stats('docs'), {
      slug: 'docs',
      clicks: 12,
      daily: [
        { date: '2026-09-19', clicks: 2 },
        { date: '2026-09-20', clicks: 0 },
        { date: '2026-09-21', clicks: 0 },
        { date: '2026-09-22', clicks: 1 },
        { date: '2026-09-23', clicks: 0 },
        { date: '2026-09-24', clicks: 0 },
        { date: '2026-09-25', clicks: 4 },
      ],
    });

    clock.now += 1; // midnight: the window moves forward a day
    const { daily } = store.stats('docs');
    assert.deepEqual(daily.map((day) => day.date), ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26']);
    assert.deepEqual(daily.map((day) => day.clicks), [0, 0, 1, 0, 0, 4, 0]);
  });

  it('ignores clicks on unknown slugs', () => {
    const { store } = storeWithClock();
    assert.equal(store.recordClick('missing'), null);
    assert.equal(store.stats('missing'), null);
  });

  it('lists links in reverse creation order, even within the same millisecond', () => {
    const { store } = storeWithClock();
    for (const slug of ['aaa', 'zzz', 'mmm', 'bbb']) store.create('https://example.com', slug);

    const first = store.list({ limit: 3 });
    assert.deepEqual(first.links.map((link) => link.slug), ['bbb', 'mmm', 'zzz']);
    const second = store.list({ limit: 3, after: first.next });
    assert.deepEqual(second.links.map((link) => link.slug), ['aaa']);
    assert.equal(second.next, null);
    assert.equal(store.list({ limit: 4 }).next, null);
  });

  it('never reuses a position, so old cursors stay correct after deletes', () => {
    const { store } = storeWithClock();
    for (const slug of ['one', 'two', 'three']) store.create('https://example.com', slug);
    const { next } = store.list({ limit: 1 }); // position of "three", the newest

    // Deleting the newest links must not hand their positions to a newer link.
    store.delete('three');
    store.delete('two');
    store.create('https://example.com', 'four');
    assert.deepEqual(store.list({ limit: 10, after: next }).links.map((link) => link.slug), ['one']);
    assert.deepEqual(store.list({ limit: 10 }).links.map((link) => link.slug), ['four', 'one']);
  });

  it('deletes a link together with its clicks', () => {
    const { db, store } = storeWithClock();
    const clickCount = () => db.prepare('SELECT COUNT(*) AS count FROM clicks').get().count;
    store.create('https://example.com', 'docs');
    store.create('https://example.com', 'kept');
    store.recordClick('docs');
    store.recordClick('kept');
    assert.equal(clickCount(), 2);

    assert.equal(store.delete('docs'), true);
    assert.equal(store.delete('docs'), false);
    assert.equal(store.get('docs'), null);
    assert.equal(clickCount(), 1);
    assert.equal(store.stats('kept').clicks, 1);
  });
});
