// GASウェブアプリのURL
// デプロイし直して新しいURLが発行されたら、ここを書き換えるだけでOK
export const API_URL =
  'https://script.google.com/macros/s/AKfycbzxury-Y5I4BjlvWNbUS4WsrcWTVJWYTnOXwxs400cIuvSa54VHEfsXyKt7K7M3D8hX8w/exec'

// GET用（action + パラメータをクエリ文字列にして呼ぶ）
export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`${API_URL}?${query}`)
  return res.json()
}

// POST用（action + データをJSONで送る）
export async function apiPost(action, data = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action, ...data }),
  })
  return res.json()
}
