import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const PAGE_BG = '#ffffff'
const INK = '#2c498f' // 「LOVE & PEACE」ロゴと同じ青
const DATE_INK = '#9c7b55' // 旧バージョンの黄みがかった色
// 透過PNG(ダニーから受け取ったPDFに埋め込まれていたロゴをそのまま抽出したもの)
const COVER_IMAGE = '/diary-cover.png'

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatDateLabel(dateKey) {
  const [y, m, d] = dateKey.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}

export async function exportDiaryPdf({ member, entries, sortedDates }) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.width = '794px'
  container.style.background = PAGE_BG
  container.style.fontFamily = "'Hina Mincho', serif"
  container.style.color = INK

  const entriesHtml = sortedDates
    .map(
      (d) => `
        <div style="margin-bottom:28px;">
          <div style="font-size:13.5px; letter-spacing:0.05em; color:${DATE_INK}; margin-bottom:8px;">${formatDateLabel(d)}</div>
          <div style="font-size:14px; line-height:2.1; white-space:pre-wrap; padding-left:2px;">${escapeHtml(entries[d].text)}</div>
        </div>
      `
    )
    .join('')

  container.innerHTML = `
    <div style="padding:56px 64px 64px;">
      <img src="${COVER_IMAGE}" style="width:140px; display:block; margin:0 auto 22px;" />
      <h1 style="font-family:'Hina Mincho', serif; font-weight:400; font-size:19px; margin:0 0 32px; color:${INK}; letter-spacing:0.08em;">自己との対話記録</h1>
      ${entriesHtml}
    </div>
  `

  document.body.appendChild(container)
  // フォント読み込み・レイアウト確定を待つ
  await new Promise((r) => setTimeout(r, 80))

  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: PAGE_BG,
    useCORS: true,
  })
  document.body.removeChild(container)

  const pdf = new jsPDF('p', 'pt', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`自己との対話_${member}.pdf`)
}
