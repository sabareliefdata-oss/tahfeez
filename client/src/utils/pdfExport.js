/**
 * High-performance, freeze-free PDF Export & Print Engine
 * Safely prints or exports official A4 landscape/portrait documents
 * without crashing or freezing the browser thread.
 */
export function exportElementToPdf(element, filename = 'report.pdf', orientation = 'landscape') {
  if (!element) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      // Remove any existing print iframes
      const oldFrames = document.querySelectorAll('iframe.tahfeez-print-frame');
      oldFrames.forEach(f => f.remove());

      // Create a hidden, sandboxed iframe for printing
      const iframe = document.createElement('iframe');
      iframe.className = 'tahfeez-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const title = filename.replace(/\.pdf$/i, '');

      // Self-contained, robust print stylesheet compatible with Arabic RTL and A4 printing
      const printStyles = `
        @page {
          size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
          margin: 8mm 6mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          direction: rtl;
          font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0;
          padding: 8px;
          font-size: 11px;
        }
        h1, h2, h3, h4, p {
          margin: 3px 0;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-extrabold { font-weight: 800; }
        .border-b-2 { border-bottom: 2px solid #064e3b; }
        .border { border: 1px solid #cbd5e1; }
        .rounded-lg { border-radius: 6px; }
        .rounded-xl { border-radius: 8px; }
        
        /* Grid and flex helpers */
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-around { justify-content: space-around; }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 10.5px;
        }
        th, td {
          border: 1px solid #94a3b8 !important;
          padding: 4px 6px;
        }
        th {
          background-color: #064e3b !important;
          color: #ffffff !important;
          font-weight: bold;
          text-align: center;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc !important;
        }

        /* Color accents */
        .bg-emerald-900 { background-color: #064e3b !important; color: #ffffff !important; }
        .bg-emerald-800 { background-color: #065f46 !important; color: #ffffff !important; }
        .bg-emerald-50 { background-color: #ecfdf5 !important; }
        .bg-emerald-100 { background-color: #d1fae5 !important; }
        .text-emerald-800 { color: #065f46 !important; }
        .text-emerald-950 { color: #022c22 !important; }
        .text-amber-300 { color: #fcd34d !important; }
        .border-emerald-200 { border-color: #a7f3d0 !important; }

        /* Hide elements that shouldn't print */
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      `;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `);
      doc.close();

      // Trigger print after iframe renders
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          resolve(true);
        } catch (e) {
          console.error('Print trigger error:', e);
          resolve(false);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
          }, 4000);
        }
      }, 250);
    } catch (err) {
      console.error('Fatal print error:', err);
      resolve(false);
    }
  });
}
