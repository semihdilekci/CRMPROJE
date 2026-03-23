'use client';

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface ExportPdfOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportDashboardToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {},
): Promise<void> {
  const {
    filename = 'rapor',
    title,
    orientation = 'landscape',
  } = options;

  const originalBg = element.style.background;
  element.style.background = '#030712';

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#030712',
    logging: false,
    windowWidth: 1400,
  });

  element.style.background = originalBg;

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;

  if (title) {
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.text(title, margin, margin + 5);
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Oluşturulma: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`,
      margin,
      margin + 10,
    );
  }

  const topOffset = title ? margin + 14 : margin;
  const usableHeight = pageHeight - topOffset - margin;
  const imgAspect = canvas.width / canvas.height;
  let imgWidth = usableWidth;
  let imgHeight = imgWidth / imgAspect;

  if (imgHeight > usableHeight) {
    imgHeight = usableHeight;
    imgWidth = imgHeight * imgAspect;
  }

  pdf.addImage(imgData, 'PNG', margin, topOffset, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}
