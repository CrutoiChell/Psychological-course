// Нормализация ссылки на видео в URL для <iframe>.
// YouTube, Rutube, VK / VK Video, Vimeo, Kinescope, Dzen.

export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const url = String(raw).trim();
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return url;
  }

  const host = u.hostname.replace(/^www\./, '').toLowerCase();

  const yt = parseYoutube(u, host);
  if (yt) return yt;

  const rt = parseRutube(u, host);
  if (rt) return rt;

  const vk = parseVk(u, host);
  if (vk) return vk;

  const vimeo = parseVimeo(u, host);
  if (vimeo) return vimeo;

  const ks = parseKinescope(u, host);
  if (ks) return ks;

  const dzen = parseDzen(u, host);
  if (dzen) return dzen;

  return url;
}

/** Подсказка для поля в админке */
export const VIDEO_URL_HINT =
  'YouTube, Rutube, VK / vkvideo.ru, Vimeo, Kinescope, Dzen — вставьте обычную ссылку на видео';

// ─── YouTube ─────────────────────────────────────────────────────────────────

function parseYoutube(u: URL, host: string): string | null {
  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id ? buildYoutubeEmbed(id, u) : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.split('/')[2];
      return id ? buildYoutubeEmbed(id, u) : null;
    }
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? buildYoutubeEmbed(id, u) : null;
    }
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? buildYoutubeEmbed(id, u) : null;
    }
    if (u.pathname.startsWith('/v/')) {
      const id = u.pathname.split('/')[2];
      return id ? buildYoutubeEmbed(id, u) : null;
    }
  }
  return null;
}

function buildYoutubeEmbed(id: string, src: URL): string {
  const params = new URLSearchParams();
  const list = src.searchParams.get('list');
  if (list) params.set('list', list);
  const start = src.searchParams.get('t') || src.searchParams.get('start');
  if (start) {
    const sec = parseTimeToSeconds(start);
    if (sec > 0) params.set('start', String(sec));
  }
  params.set('rel', '0');
  const qs = params.toString();
  return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ''}`;
}

// ─── Rutube ──────────────────────────────────────────────────────────────────

function parseRutube(u: URL, host: string): string | null {
  if (host !== 'rutube.ru' && host !== 'rutube.dev') return null;

  // Уже embed: /play/embed/{id}
  const embedMatch = u.pathname.match(/\/play\/embed\/([a-f0-9-]+)/i);
  if (embedMatch) return `https://rutube.ru/play/embed/${embedMatch[1]}`;

  // /video/{id}/ или /video/private/{id}/
  const videoMatch = u.pathname.match(/\/video(?:\/private)?\/([a-f0-9-]+)/i);
  if (videoMatch) return `https://rutube.ru/play/embed/${videoMatch[1]}`;

  // Shorts: /shorts/{id}
  const shortsMatch = u.pathname.match(/\/shorts\/([a-f0-9-]+)/i);
  if (shortsMatch) return `https://rutube.ru/play/embed/${shortsMatch[1]}`;

  return null;
}

// ─── VK / VK Video ───────────────────────────────────────────────────────────

function parseVk(u: URL, host: string): string | null {
  const vkHosts = ['vk.com', 'vk.ru', 'm.vk.com', 'vkvideo.ru', 'm.vkvideo.ru'];
  if (!vkHosts.includes(host)) return null;

  if (u.pathname.includes('video_ext.php')) return u.toString();

  // video-123_456 или video123_456
  const m = u.pathname.match(/video(-?\d+)_(\d+)/i);
  if (m) {
    const oid = m[1];
    const id = m[2];
    const params = new URLSearchParams({ oid, id, hd: '2' });
    const t = u.searchParams.get('t');
    if (t) params.set('t', t);
    return `https://vk.com/video_ext.php?${params}`;
  }

  // ?z=video-123_456
  const z = u.searchParams.get('z') || u.hash.replace(/^#/, '');
  const zm = z.match(/video(-?\d+)_(\d+)/i);
  if (zm) {
    return `https://vk.com/video_ext.php?oid=${zm[1]}&id=${zm[2]}&hd=2`;
  }

  return null;
}

// ─── Vimeo ───────────────────────────────────────────────────────────────────

function parseVimeo(u: URL, host: string): string | null {
  if (host === 'player.vimeo.com') return u.toString();
  if (host === 'vimeo.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    const id = parts.find(p => /^\d+$/.test(p));
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  return null;
}

// ─── Kinescope ───────────────────────────────────────────────────────────────

function parseKinescope(u: URL, host: string): string | null {
  if (host !== 'kinescope.io') return null;
  if (u.pathname.startsWith('/embed/')) return u.toString();
  const id = u.pathname.split('/').filter(Boolean)[0];
  if (id && /^[a-zA-Z0-9_-]+$/.test(id)) return `https://kinescope.io/embed/${id}`;
  return null;
}

// ─── Dzen ────────────────────────────────────────────────────────────────────

function parseDzen(u: URL, host: string): string | null {
  if (host !== 'dzen.ru' && host !== 'zen.yandex.ru') return null;

  if (u.pathname.startsWith('/embed/')) return u.toString();

  // /video/watch/{id}
  const watch = u.pathname.match(/\/video\/watch\/([a-zA-Z0-9_-]+)/);
  if (watch) return `https://dzen.ru/embed/${watch[1]}`;

  // /video/{id}
  const video = u.pathname.match(/\/video\/([a-zA-Z0-9_-]+)/);
  if (video && video[1] !== 'watch') return `https://dzen.ru/embed/${video[1]}`;

  return null;
}

function parseTimeToSeconds(t: string): number {
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!m) return 0;
  const [, h, mi, s] = m;
  return (parseInt(h || '0', 10) * 3600) + (parseInt(mi || '0', 10) * 60) + parseInt(s || '0', 10);
}
