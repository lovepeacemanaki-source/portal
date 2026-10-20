// GASウェブアプリのURL
// デプロイし直して新しいURLが発行されたら、ここを書き換えるだけでOK
export const API_URL =
  'https://script.google.com/macros/s/AKfycbzxury-Y5I4BjlvWNbUS4WsrcWTVJWYTnOXwxs400cIuvSa54VHEfsXyKt7K7M3D8hX8w/exec'

// GET用（action + パラメータをクエリ文字列にして呼ぶ）
export async function apiGet(action, params = {}) {
  // ブラウザ/中継サーバーによる古いレスポンスのキャッシュを避ける
  const query = new URLSearchParams({ action, ...params, _ts: Date.now() }).toString()
  const res = await fetch(`${API_URL}?${query}`, { cache: 'no-store' })
  return res.json()
}

// POST用（action + データをJSONで送る）
// 書き込み系はログイン時に発行されたトークンを自動で添える（セッション認証）
export async function apiPost(action, data = {}) {
  const token = localStorage.getItem('lp_token') || ''
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action, token, ...data }),
  })
  return res.json()
}
