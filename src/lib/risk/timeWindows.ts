/**
 * ORCA Time Window Utilities
 * Calculates dynamic target forecast timestamps (e.g. "Tomorrow Morning")
 * without hard-coding static calendar dates.
 */

/**
 * Returns ISO 8601 string for tomorrow at 06:00 AM local time.
 */
export function getTomorrowMorningIso(timezoneOffsetHours = 5.5): string {
  const now = new Date();
  
  // Create date object for tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  
  // Set to 06:00:00 in target timezone
  // For IST (UTC+5.5), 06:00 IST is 00:30 UTC
  const utcHours = 6 - Math.floor(timezoneOffsetHours);
  const utcMinutes = Math.round((timezoneOffsetHours % 1) * 60);
  
  tomorrow.setUTCHours(Math.max(0, utcHours), utcMinutes, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Generates a human-friendly label from an ISO timestamp.
 */
export function formatTimeWindowLabel(targetTimeIso?: string): string {
  if (!targetTimeIso) return 'Current Observation';

  const target = new Date(targetTimeIso);
  const now = new Date();
  
  const isTomorrow =
    target.getDate() === new Date(now.getTime() + 24 * 3600 * 1000).getDate() &&
    target.getMonth() === new Date(now.getTime() + 24 * 3600 * 1000).getMonth();

  const isToday =
    target.getDate() === now.getDate() && target.getMonth() === now.getMonth();

  const timeStr = target.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (isTomorrow) {
    return `Tomorrow Morning (${timeStr})`;
  } else if (isToday) {
    return `Today (${timeStr})`;
  }

  return target.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
