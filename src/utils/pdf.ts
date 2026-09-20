import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculatedPackage } from '../types';

export type PrintMode = 'full' | 'customer';

/**
 * Generate and download a PDF document using jsPDF & autoTable
 */
export function exportToPdf(
  packages: CalculatedPackage[],
  mode: PrintMode = 'full',
  fileName?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('DAFTAR HARGA JUAL PAKET DATA', 14, 18);

  // Subheader
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const subtext =
    mode === 'customer'
      ? `Katalog Harga Resmi | Tanggal: ${dateFormatted} ${timeFormatted} | Total: ${packages.length} Paket`
      : `Laporan Penentuan Harga Jual (Internal Kasir) | Tanggal: ${dateFormatted} ${timeFormatted} | Total: ${packages.length} Paket`;
  doc.text(subtext, 14, 24);

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 27, 196, 27);

  // Prepare table data
  let tableHeaders: string[];
  let tableRows: (string | number)[][];

  const getProductDisplayLabel = (pkg: CalculatedPackage, isCustomer: boolean): string => {
    if (pkg.category === 'microsd') {
      const capTag = pkg.storageCapacity ? ` [MICROSD ${pkg.storageCapacity}]` : ' [MICROSD]';
      return isCustomer ? `${pkg.name}${capTag}` : `${pkg.name}${capTag} (+${pkg.marginFormatted})`;
    }
    if (pkg.category === 'powerbank') {
      return isCustomer ? `${pkg.name} [POWERBANK]` : `${pkg.name} [POWERBANK +15rb]`;
    }
    if (pkg.category === 'aksesoris') {
      return isCustomer ? `${pkg.name} [AKSESORIS HP]` : `${pkg.name} [AKSESORIS +${pkg.marginFormatted}]`;
    }
    if (pkg.category === 'perdana' || pkg.isPerdana) {
      return isCustomer ? `${pkg.name} [PERDANA]` : `${pkg.name} [PERDANA +5rb]`;
    }
    return pkg.name;
  };

  if (mode === 'customer') {
    tableHeaders = ['No', 'Nama Produk / Paket', 'Masa Aktif / Kapasitas', 'Harga Jual'];
    tableRows = packages.map((pkg, index) => [
      index + 1,
      getProductDisplayLabel(pkg, true),
      pkg.activeDaysFormatted,
      pkg.sellingPriceFormatted,
    ]);
  } else {
    tableHeaders = [
      'No',
      'Nama Produk / Paket',
      'Masa Aktif / Kapasitas',
      'Harga Modal',
      'Modal+Untung',
      'Harga Jual',
      'Untung Riil',
    ];
    tableRows = packages.map((pkg, index) => [
      index + 1,
      getProductDisplayLabel(pkg, false),
      pkg.activeDaysFormatted,
      pkg.costPriceFormatted,
      pkg.totalBeforeRoundingFormatted,
      pkg.sellingPriceFormatted,
      `+${pkg.actualProfitFormatted}`,
    ]);
  }

  // Generate table with autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 31,
    theme: 'grid',
    headStyles: {
      fillColor: mode === 'customer' ? [16, 185, 129] : [67, 56, 202], // Emerald for customer, Indigo for admin
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    columnStyles:
      mode === 'customer'
        ? {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 28 },
            3: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
          }
        : {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'right', cellWidth: 26 },
            4: { halign: 'right', cellWidth: 26 },
            5: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
            6: { halign: 'right', textColor: [5, 150, 105], cellWidth: 24 },
          },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${pageNumber} | Penentuan Harga Jual Paket Data`,
        14,
        doc.internal.pageSize.height - 8
      );
    },
  });

  const defaultName =
    mode === 'customer'
      ? `Daftar_Harga_Paket_Pelanggan_${now.toISOString().slice(0, 10)}.pdf`
      : `Daftar_Harga_Jual_Paket_Lengkap_${now.toISOString().slice(0, 10)}.pdf`;

  doc.save(fileName || defaultName);
}

/**
 * Print directly to printer by generating an isolated printable HTML document
 */
export function printTableToPrinter(
  packages: CalculatedPackage[],
  mode: PrintMode = 'full'
): boolean {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const title =
    mode === 'customer'
      ? 'DAFTAR HARGA PAKET DATA'
      : 'DAFTAR HARGA JUAL PAKET DATA (INTERNAL)';

  const rowsHtml = packages
    .map((pkg, idx) => {
      let badgeHtml = '';
      if (pkg.category === 'microsd') {
        badgeHtml = ` <span style="font-size: 10px; color: #0f766e; background: #ccfbf1; padding: 1px 5px; border-radius: 3px; font-weight: 600;">MICROSD ${pkg.storageCapacity || ''}</span>`;
      } else if (pkg.category === 'powerbank') {
        badgeHtml = ` <span style="font-size: 10px; color: #b45309; background: #fef3c7; padding: 1px 5px; border-radius: 3px; font-weight: 600;">POWERBANK</span>`;
      } else if (pkg.category === 'aksesoris') {
        badgeHtml = ` <span style="font-size: 10px; color: #c2410c; background: #ffedd5; padding: 1px 5px; border-radius: 3px; font-weight: 600;">AKSESORIS HP</span>`;
      } else if (pkg.category === 'perdana' || pkg.isPerdana) {
        badgeHtml = ` <span style="font-size: 10px; color: #7e22ce; background: #f3e8ff; padding: 1px 5px; border-radius: 3px; font-weight: 600;">PERDANA</span>`;
      }
      const displayName = `${pkg.name}${badgeHtml}`;

      if (mode === 'customer') {
        return `
          <tr>
            <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="text-align: left; padding: 6px 8px; font-weight: 500; border: 1px solid #cbd5e1;">${displayName}</td>
            <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${pkg.activeDaysFormatted}</td>
            <td style="text-align: right; padding: 6px 8px; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">${pkg.sellingPriceFormatted}</td>
          </tr>
        `;
      }
      return `
        <tr>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="text-align: left; padding: 6px 8px; font-weight: 500; border: 1px solid #cbd5e1;">${displayName}</td>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #cbd5e1;">${pkg.activeDaysFormatted}</td>
          <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1;">${pkg.costPriceFormatted}</td>
          <td style="text-align: right; padding: 6px 8px; border: 1px solid #cbd5e1;">${pkg.totalBeforeRoundingFormatted}</td>
          <td style="text-align: right; padding: 6px 8px; font-weight: bold; color: #4338ca; border: 1px solid #cbd5e1;">${pkg.sellingPriceFormatted}</td>
          <td style="text-align: right; padding: 6px 8px; font-weight: 600; color: #059669; border: 1px solid #cbd5e1;">+${pkg.actualProfitFormatted}</td>
        </tr>
      `;
    })
    .join('');

  const tableHeaderHtml =
    mode === 'customer'
      ? `
        <tr style="background-color: #047857; color: white;">
          <th style="padding: 8px; border: 1px solid #047857; width: 40px;">No</th>
          <th style="padding: 8px; border: 1px solid #047857; text-align: left;">Nama Produk / Paket</th>
          <th style="padding: 8px; border: 1px solid #047857; width: 110px;">Masa Aktif / Ket</th>
          <th style="padding: 8px; border: 1px solid #047857; text-align: right; width: 140px;">Harga Jual</th>
        </tr>
      `
      : `
        <tr style="background-color: #3730a3; color: white;">
          <th style="padding: 8px; border: 1px solid #3730a3; width: 35px;">No</th>
          <th style="padding: 8px; border: 1px solid #3730a3; text-align: left;">Nama Produk / Paket</th>
          <th style="padding: 8px; border: 1px solid #3730a3; width: 95px;">Masa Aktif / Ket</th>
          <th style="padding: 8px; border: 1px solid #3730a3; text-align: right; width: 105px;">Harga Modal</th>
          <th style="padding: 8px; border: 1px solid #3730a3; text-align: right; width: 110px;">Modal+Untung</th>
          <th style="padding: 8px; border: 1px solid #3730a3; text-align: right; width: 115px;">Harga Jual</th>
          <th style="padding: 8px; border: 1px solid #3730a3; text-align: right; width: 95px;">Untung Riil</th>
        </tr>
      `;

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            margin-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 4px 0;
            color: #0f172a;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 16px;
            font-size: 10px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          <p class="subtitle">Update: ${dateFormatted} ${timeFormatted} | Total: ${packages.length} Paket</p>
        </div>
        <table>
          <thead>
            ${tableHeaderHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          <span>Dicetak secara otomatis dari Sistem Penentuan Harga Jual Paket Data</span>
          <span>Halaman 1</span>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;

  // Try opening in a new print window first
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printDocumentHtml);
      printWindow.document.close();
      return true;
    }
  } catch (err) {
    console.warn('Popup window blocked or error, falling back to hidden iframe print', err);
  }

  // Fallback: Invisible iframe in current document
  try {
    let iframe = document.getElementById('print-service-frame') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-service-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printDocumentHtml);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      return true;
    }
  } catch (err) {
    console.warn('Iframe print failed', err);
  }

  // Final fallback: trigger standard window.print()
  try {
    window.print();
    return true;
  } catch (err) {
    console.error('All print methods failed', err);
    return false;
  }
}
