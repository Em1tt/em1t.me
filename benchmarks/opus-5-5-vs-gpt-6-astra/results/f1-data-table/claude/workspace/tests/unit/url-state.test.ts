import { describe, expect, it } from 'vitest';
import { parseViewState, serializeViewState } from '../../src/url-state';
import { DEFAULT_VIEW_STATE, type ViewState } from '../../src/view';

const departments = ['Design', 'Engineering', 'Sales'];
const parse = (search: string) => parseViewState(search, departments);

describe('parseViewState', () => {
  it('gives the default view for an empty query string', () => {
    expect(parse('')).toEqual(DEFAULT_VIEW_STATE);
    expect(parse('?')).toEqual(DEFAULT_VIEW_STATE);
  });

  it('reads every parameter', () => {
    expect(parse('?q=ann&dept=Sales&sort=startDate&dir=desc&page=3')).toEqual({
      query: 'ann',
      department: 'Sales',
      sort: { key: 'startDate', dir: 'desc' },
      page: 3,
    });
  });

  it('keeps the search text exactly as typed', () => {
    expect(parse('?q=%20Ann%20Lee%20').query).toBe(' Ann Lee ');
    expect(parse('?q=ann+lee').query).toBe('ann lee');
    expect(parse('?q=Z%C3%BCrich').query).toBe('Zürich');
  });

  it('ignores unknown departments', () => {
    expect(parse('?dept=Legal').department).toBe('');
    expect(parse('?dept=sales').department).toBe('');
  });

  it('ignores unknown sort columns', () => {
    expect(parse('?sort=id&dir=desc').sort).toBeNull();
    expect(parse('?sort=Salary&dir=asc').sort).toBeNull();
    expect(parse('?dir=desc').sort).toBeNull();
  });

  it('sorts ascending when the direction is missing or invalid', () => {
    expect(parse('?sort=name').sort).toEqual({ key: 'name', dir: 'asc' });
    expect(parse('?sort=name&dir=up').sort).toEqual({ key: 'name', dir: 'asc' });
  });

  it('ignores page numbers that are not positive whole numbers', () => {
    for (const page of ['0', '-2', 'abc', '2.5', '1e2', '', '%20']) {
      expect(parse(`?page=${page}`).page).toBe(1);
    }
    expect(parse('?page=7').page).toBe(7);
  });

  it('leaves a page past the end for the view to clamp', () => {
    expect(parse('?page=999').page).toBe(999);
  });
});

describe('serializeViewState', () => {
  it('writes nothing for the default view', () => {
    expect(serializeViewState(DEFAULT_VIEW_STATE)).toBe('');
  });

  it('writes the parameters in a fixed order', () => {
    const state: ViewState = {
      query: 'ann',
      department: 'Sales',
      sort: { key: 'salary', dir: 'desc' },
      page: 2,
    };
    expect(serializeViewState(state)).toBe('?q=ann&dept=Sales&sort=salary&dir=desc&page=2');
  });

  it('leaves out default values', () => {
    expect(serializeViewState({ ...DEFAULT_VIEW_STATE, page: 1, department: 'Design' })).toBe('?dept=Design');
    expect(serializeViewState({ ...DEFAULT_VIEW_STATE, sort: { key: 'name', dir: 'asc' } })).toBe(
      '?sort=name&dir=asc',
    );
  });

  it('round-trips through parseViewState', () => {
    const states: ViewState[] = [
      DEFAULT_VIEW_STATE,
      { query: '  São Paulo & co ', department: 'Engineering', sort: { key: 'startDate', dir: 'asc' }, page: 4 },
      { query: "o'brien+100%", department: '', sort: null, page: 2 },
    ];
    for (const state of states) expect(parse(serializeViewState(state))).toEqual(state);
  });
});
