// Private local qualification policy. No caller/import/environment flag can
// mint a continuous origin capability. The reviewed observation paths do not
// cover every store to an already dirty MAP_SHARED input (see acceptance record).
export const portableOriginIntervalPolicy = 'redue-portable-origin-interval@1';
export const portableOriginIntervalReason = 'PORTABLE_ORIGIN_INTERVAL_UNSUPPORTED';
export const portableOriginIntervalSupported = () => false;
export function requirePortableOriginInterval() {
  if (!portableOriginIntervalSupported())
    throw Object.assign(Error('Portable origin continuity is unsupported; historical outcomes remain intact'),
      {code: portableOriginIntervalReason});
}
// A new client must also refuse an older observer's green imported decision.
// Catalog entries here come from the owned local reader, never request claims.
export function containPortableStatus(value, catalog) {
  if (portableOriginIntervalSupported() || !Array.isArray(value?.checks) || !Array.isArray(catalog?.records)) return value;
  const accepted = new Set(catalog.records.filter(record =>
    ['manual-digest-v1', 'github-ci-v1'].includes(record?.acceptance)).map(record => record.check));
  if (!value.checks.some(row => accepted.has(row.name))) return value;
  const checks = value.checks.map(row => !accepted.has(row.name) ? row : {
    ...row, freshness: 'UNVERIFIED', reuse_eligible: false, reason_code: portableOriginIntervalReason,
    reason: 'Portable origin continuity is unsupported; imported execution outcomes remain historical',
    ...(row.portable_evidence ? {portable_evidence: {...row.portable_evidence,
      freshness: 'UNVERIFIED', reuse_eligible: false, reason: portableOriginIntervalReason}} : {})
  });
  const current = checks.filter(row => row.freshness === 'CURRENT' && row.result === 'PASS').length,
    failed = checks.filter(row => row.freshness === 'CURRENT' && row.result === 'FAIL').length,
    stale = checks.filter(row => row.freshness === 'STALE').length,
    unverified = checks.filter(row => row.freshness === 'UNVERIFIED').length;
  return {...value, checks, current, failed, stale, unverified,
    observed_failed: checks.filter(row => row.result === 'FAIL').length,
    state: failed ? 'failed' : unverified ? 'unverified' : stale ? 'stale' : 'current'};
}
