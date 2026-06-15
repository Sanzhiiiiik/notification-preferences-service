import type { Channel, GlobalPolicy, NotificationType, Region } from './types.js';

function matchesNullable<T extends string>(policyValue: T | null, actualValue: T): boolean {
  return policyValue === null || policyValue === actualValue;
}

function specificityScore(policy: GlobalPolicy): number {
  let score = 0;

  if (policy.notificationType !== null) score += 1;
  if (policy.channel !== null) score += 1;
  if (policy.region !== null) score += 1;

  return score;
}

export function findMatchingGlobalPolicy(params: {
  policies: GlobalPolicy[];
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
}): GlobalPolicy | null {
  const matchingPolicies = params.policies
    .filter((policy) => policy.enabled)
    .filter((policy) => policy.effect === 'deny')
    .filter((policy) =>
      matchesNullable(policy.notificationType, params.notificationType) &&
      matchesNullable(policy.channel, params.channel) &&
      matchesNullable(policy.region, params.region)
    )
    .sort((a, b) => specificityScore(b) - specificityScore(a));

  return matchingPolicies[0] ?? null;
}
