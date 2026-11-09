// Тонкая прослойка перед статикой сайта.
// Нужна только ради одного: статика Workers не умеет Range-запросы (не отдаёт 206),
// а Safari из-за этого не проигрывает ролики. Всё остальное уходит в ASSETS как есть.

const REEL_PATTERN = /^\/assets\/dbd\/[^/]+\.mp4$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // При html_handling "none" статика не подставляет index.html на корень,
    // поэтому "/" отправляем на него вручную.
    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    }

    if (!REEL_PATTERN.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // В статику запрос уходит без Range: так она гарантированно отдаст весь файл.
    const asset = await env.ASSETS.fetch(new Request(url, { method: "GET", headers: request.headers }));
    if (!asset.ok) {
      return asset;
    }

    const body = await asset.arrayBuffer();
    const size = body.byteLength;
    const headers = new Headers(asset.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");

    if (request.method === "HEAD") {
      headers.set("Content-Length", String(size));
      return new Response(null, { status: 200, headers });
    }

    const range = parseRange(request.headers.get("Range"), size);
    if (range === "invalid") {
      return new Response(null, {
        status: 416,
        headers: { "Accept-Ranges": "bytes", "Content-Range": `bytes */${size}` },
      });
    }
    if (!range) {
      headers.set("Content-Length", String(size));
      return new Response(body, { status: 200, headers });
    }

    headers.set("Content-Length", String(range.end - range.start + 1));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    return new Response(body.slice(range.start, range.end + 1), { status: 206, headers });
  },
};

// Возвращает { start, end } для 206, null - если Range нет или он неразборчивый,
// "invalid" - если диапазон за пределами файла (по спецификации это 416).
function parseRange(header, size) {
  if (!header) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) {
    return null;
  }

  let start;
  let end;

  if (match[1] === "") {
    const suffix = Number(match[2]);
    if (!suffix) {
      return null;
    }
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }

  if (start >= size) {
    return "invalid";
  }
  if (start > end) {
    return "invalid";
  }

  return { start, end };
}
