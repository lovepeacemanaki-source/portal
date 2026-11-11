// GASウェブアプリのURL
// デプロイし直して新しいURLが発行されたら、ここを書き換えるだけでOK
export const API_URL =
  'https://script.google.com/macros/s/AKfycbzxury-Y5I4BjlvWNbUS4WsrcWTVJWYTnOXwxs400cIuvSa54VHEfsXyKt7K7M3D8hX8w/exec'

const GET_TIMEOUT_MS = 15000
const GET_RETRIES = 2
const POST_TIMEOUT_MS = 30000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// GET用（action + パラメータをクエリ文字列にして呼ぶ）
// 読むだけなので、通信エラー・時間切れ・GASの一時的な不調(HTML が返る等)は自動で再試行する
export async function apiGet(action, params = {}) {
  let lastError
  for (let attempt = 0; attempt <= GET_RETRIES; attempt++) {
    try {
      // ブラウザ/中継サーバーによる古いレスポンスのキャッシュを避ける
      const query = new URLSearchParams({ action, ...params, _ts: Date.now() }).toString()
      const res = await fetchWithTimeout(`${API_URL}?${query}`, { cache: 'no-store' }, GET_TIMEOUT_MS)
      return await res.json()
    } catch (err) {
      lastError = err
      if (attempt < GET_RETRIES) await sleep(800 * (attempt + 1) + Math.random() * 400)
    }
  }
  throw lastError
}

// POST用（action + データをJSONで送る）
// 書き込み系はログイン時に発行されたトークンを自動で添える（セッション認証）
// 二重投稿を避けるため、POSTは自動で再試行しない
export async function apiPost(action, data = {}) {
  const token = localStorage.getItem('lp_token') || ''
  const res = await fetchWithTimeout(
    API_URL,
    {
      method: 'POST',
      body: JSON.stringify({ action, token, ...data }),
    },
    POST_TIMEOUT_MS,
  )
  return res.json()
}

// ---- 読み込み結果のローカル保存(2回目以降の表示を速くする) ----
// 本人専用データ(日記)や管理人専用データ(パスワード付きメンバー一覧)には使わないこと
const CACHE_PREFIX = 'lp_cache:'

function cacheKey(action, params) {
  return CACHE_PREFIX + action + ':' + JSON.stringify(params)
}

function readCache(action, params) {
  try {
    const raw = localStorage.getItem(cacheKey(action, params))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(action, params, data) {
  try {
    localStorage.setItem(cacheKey(action, params), JSON.stringify(data))
  } catch {
    // 容量オーバーやプライベートモードでは保存しないだけ
  }
}

export function clearApiCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // 何もしない
  }
}

// 前回の結果があれば onCached ですぐ渡し、そのあと最新を取りに行って返す。
// 最新の取得に失敗しても、前回の結果があればそれを返す(何も無い時だけエラーにする)
// allowStale=false の時は、最新が取れなければ前回の結果を返さずエラーにする(投稿直後の再読み込み用)
export async function apiGetCached(action, params = {}, onCached, { allowStale = true } = {}) {
  const cached = readCache(action, params)
  if (cached && onCached) onCached(cached)
  try {
    const fresh = await apiGet(action, params)
    if (!fresh.error && fresh.success !== false) writeCache(action, params, fresh)
    return fresh
  } catch (err) {
    if (cached && allowStale) return cached
    throw err
  }
}
