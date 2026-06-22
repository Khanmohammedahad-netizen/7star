import type { PdfDoc } from '../components/finance/DocumentPDF';

/**
 * Lazily loads @react-pdf/renderer (a heavy dependency) only when the user
 * actually exports a PDF, keeping it out of the initial bundle.
 */
export async function downloadDocumentPdf(doc: PdfDoc): Promise<void> {
  const [{ pdf }, { DocumentPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/finance/DocumentPDF'),
  ]);
  const blob = await pdf(<DocumentPDF doc={doc} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
