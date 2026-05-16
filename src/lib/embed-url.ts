// Нормализация ссылки на видео в безопасный для <iframe> embed-URL.
// Поддерживает YouTube (watch, youtu.be, shorts, уже-embed) и Vimeo.
// Если ссылка не распознана — возвращает её как есть (пусть пользователь увидит сломанное видео и сообразит).

export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const url = String(raw).trim();
  if (!url) return null;

  let u: URL;
  try { u = new URL(url); } catch { return url; }

  const host = u.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id ? buildYoutubeEmbed(id, u) : url;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.split('/')[2];
      return id ? buildYoutubeEmbed(id, u) : url;
    }
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? buildYoutubeEmbed(id, u) : url;
    }
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? buildYoutubeEmbed(id, u) : url;
    }
    if (u.pathname.startsWith('/v/')) {
      const id = u.pathname.split('/')[2];
      return id ? buildYoutubeEmbed(id, u) : url;
    }
  }

  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
  }
  if (host === 'player.vimeo.com') return url;

  return url;
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

function parseTimeToSeconds(t: string): number {
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!m) return 0;
  const [, h, mi, s] = m;
  return (parseInt(h || '0', 10) * 3600) + (parseInt(mi || '0', 10) * 60) + parseInt(s || '0', 10);
}
