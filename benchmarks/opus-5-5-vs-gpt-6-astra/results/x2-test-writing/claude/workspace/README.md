# semver

A small subset of [semantic versioning](https://semver.org), in `src/semver.js`.

## `parse(text)`

Parses `MAJOR.MINOR.PATCH`, optionally followed by `-PRERELEASE` and `+BUILD`, into
`{ major, minor, patch, prerelease }`, or returns `null` if the text isn't a valid version.

- Surrounding whitespace and a leading `v` are allowed: `' v1.2.3 '` is `1.2.3`.
- Numbers have no leading zeros: `01.2.3` is invalid, `0.2.3` is fine. All three parts are
  required: `1.2` is invalid.
- The pre-release is a list of dot-separated identifiers of `0-9A-Za-z-`, none empty. Numeric
  identifiers can't have leading zeros either (`1.0.0-01` is invalid), and become numbers in
  `prerelease`: `1.2.3-beta.10` → `['beta', 10]`.
- Build metadata after `+` is allowed and ignored: `1.2.3+build.5` is `1.2.3`.
- Anything that isn't a string returns `null`.

## `compare(a, b)`

Returns `-1`, `0` or `1` as version `a` is lower than, equal to or higher than `b`. Throws a
`TypeError` if either isn't a valid version.

- Major, then minor, then patch, compared as numbers.
- A version with a pre-release is lower than the same version without: `1.0.0-alpha` < `1.0.0`.
- Pre-releases are compared identifier by identifier: numeric identifiers as numbers,
  alphanumeric ones as strings (ASCII order), and a numeric identifier is lower than an
  alphanumeric one. If all identifiers are equal, the shorter list is lower:
  `1.0.0-alpha` < `1.0.0-alpha.1` < `1.0.0-alpha.beta` < `1.0.0-beta` < `1.0.0-beta.2` <
  `1.0.0-beta.11` < `1.0.0-rc.1` < `1.0.0`.
- Build metadata is ignored: `1.0.0+a` and `1.0.0+b` are equal.

## `satisfies(version, range)`

Returns whether the version is in the range. An invalid version returns `false`; an invalid range
throws a `TypeError`.

A range is one or more **sets** separated by `||`; the version must satisfy every **comparator**
in at least one set. Comparators in a set are separated by spaces.

| Comparator            | Means                                         |
| --------------------- | --------------------------------------------- |
| `1.2.3` or `=1.2.3`   | exactly 1.2.3                                 |
| `>1.2.3`, `>=1.2.3`   | greater than, or greater or equal             |
| `<1.2.3`, `<=1.2.3`   | less than, or less or equal                   |
| `^1.2.3`              | `>=1.2.3 <2.0.0`: changes that don't modify the left-most non-zero part. So `^0.2.3` is `>=0.2.3 <0.3.0` and `^0.0.3` is `>=0.0.3 <0.0.4` |
| `~1.2.3`              | `>=1.2.3 <1.3.0`: patch-level changes         |
| `1.x`, `1.*`, `1`     | `>=1.0.0 <2.0.0`                              |
| `1.2.x`, `1.2`        | `>=1.2.0 <1.3.0`                              |
| `*`, `x` or empty     | any version                                   |

A partial version after an operator covers its whole span: `>1.2` means `>=1.3.0`, `<1.2`
means `<1.2.0`, `<=1.2` means `<1.3.0` and `>=1.2` means `>=1.2.0`.

**Pre-releases**: a version with a pre-release only satisfies a set if it satisfies every
comparator in it **and** one of the set's comparators has a pre-release on the same
`MAJOR.MINOR.PATCH`. So `1.2.3-beta.2` satisfies `>=1.2.3-beta.1` but `1.2.4-beta.1` doesn't,
and no pre-release satisfies `*`.

## `maxSatisfying(versions, range)`

Returns the highest version (the string, as given) in the list that satisfies the range, or
`null` if none does. Invalid versions in the list are skipped.
