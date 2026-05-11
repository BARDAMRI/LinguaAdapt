import { Platform, Share } from 'react-native';

export type ShareProgressInput = {
  accuracyPct: number;
  streak: number;
  totalPoints: number;
  newWordsLearned: number;
  categoryLabel: string;
  title: string;
  bodyTemplate: string;
};

/**
 * Interpolate %{key} placeholders in template (i18n-friendly).
 */
export function formatShareBody(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/%\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export type ShareProgressResult = { usedSystemShare: boolean };

export async function shareProgressText(
  input: ShareProgressInput,
): Promise<ShareProgressResult> {
  const { title, bodyTemplate, ...rest } = input;
  const message = formatShareBody(bodyTemplate, {
    accuracy: rest.accuracyPct,
    streak: rest.streak,
    points: rest.totalPoints,
    newWords: rest.newWordsLearned,
    category: rest.categoryLabel,
  });
  const full = `${title}\n\n${message}`;
  if (Platform.OS === 'web') {
    const nav = window.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title, text: full });
        return { usedSystemShare: true };
      } catch {
        /* user cancel or unsupported */
      }
    }
    try {
      await window.navigator.clipboard.writeText(full);
    } catch {
      /* ignore */
    }
    return { usedSystemShare: false };
  }
  try {
    await Share.share({ message: full, title });
    return { usedSystemShare: true };
  } catch {
    return { usedSystemShare: false };
  }
}

/**
 * Web-only: generate a simple PNG data URL for a minimal share card.
 */
export function createShareCardDataUrl(
  lines: string[],
  colors: { bg: string; accent: string; text: string },
): string | null {
  if (typeof document === 'undefined') return null;
  const w = 1200;
  const h = 630;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, colors.bg);
  g.addColorStop(1, '#0f172a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, w, 10);

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  let y = 120;
  for (const line of lines) {
    ctx.fillText(line, 80, y);
    y += 72;
  }

  return canvas.toDataURL('image/png');
}
