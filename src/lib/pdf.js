import jsPDF from 'jspdf'
import 'jspdf-autotable'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function generatePDF(project) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const categories = project.settings?.categories || []
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(project.name || 'Project', pageWidth / 2, y, { align: 'center' })
  y += 8

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(`Report: ${formatDate(new Date().toISOString())}`, pageWidth / 2, y, { align: 'center' })
  y += 4

  if (project.start_date || project.end_date) {
    doc.text(
      `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`,
      pageWidth / 2, y, { align: 'center' }
    )
    y += 4
  }

  // Overall progress
  const overallProgress = categories.length > 0
    ? Math.round(categories.reduce((s, c) => s + (c.progress || 0), 0) / categories.length)
    : 0

  y += 4
  doc.setTextColor(0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Progress: ${overallProgress}%`, 14, y)
  y += 2

  // Progress bar
  doc.setFillColor(230, 230, 230)
  doc.roundedRect(14, y, pageWidth - 28, 4, 2, 2, 'F')
  const barColor = overallProgress < 30 ? [239, 68, 68] : overallProgress <= 70 ? [234, 179, 8] : [16, 185, 129]
  doc.setFillColor(...barColor)
  const barWidth = Math.max(0, ((pageWidth - 28) * overallProgress) / 100)
  if (barWidth > 0) doc.roundedRect(14, y, barWidth, 4, 2, 2, 'F')
  y += 12

  // Categories
  categories.forEach((cat) => {
    // Check page overflow
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(cat.name, 14, y)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(`${cat.progress}%`, pageWidth - 14, y, { align: 'right' })
    y += 6

    const subs = cat.subcategories || []
    if (subs.length > 0) {
      const tableData = subs.map((sub) => [
        sub.name || '',
        `${sub.progress}%`,
        sub.workers || 0,
        sub.done ? 'Yes' : 'No',
        sub.comment || '',
      ])

      doc.autoTable({
        startY: y,
        head: [['Subcategory', 'Progress', 'Workers', 'Done', 'Comment']],
        body: tableData,
        margin: { left: 14, right: 14 },
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 'auto' },
        },
        didDrawPage: () => {
          // footer
        },
      })

      y = doc.lastAutoTable.finalY + 8
    } else {
      y += 4
    }
  })

  // Footer on last page
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180)
    doc.text(
      `${i} / ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Download
  const fileName = `${project.name || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
