// utils/receipt/buildReceipt.js
// Optimized space-efficient receipt builder
import { months } from '@/utils/constants/backend';

export function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }
  
  if (num >= 10000000) {
    const remainder = num % 10000000;
    return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
  }
  if (num >= 100000) {
    const remainder = num % 100000;
    return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
  }
  if (num >= 1000) {
    const remainder = num % 1000;
    return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
  }
  return convertLessThanThousand(num);
}

// Everything interpolated into the receipt is escaped: names, descriptions etc. are user input
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 2,500 or 2,500.50 (never 2,500.5)
const money = (n) => {
  const value = Number(n || 0);
  const digits = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: 2 });
};

const formatMethod = (method) => {
  if (!method) return '';
  if (['upi', 'neft', 'rtgs', 'imps'].includes(method.toLowerCase())) return method.toUpperCase();
  return method.charAt(0).toUpperCase() + method.slice(1);
};

function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = numberToWords(rupees) + ' Rupees';
  if (paise > 0) words += ' and ' + numberToWords(paise) + ' Paise';
  return words + ' Only';
}

const MONTH_ORDER = months.map(m => m.name); // Apr ... Mar, session order
const monthOf = (period) => /^([A-Z][a-z]{2})-\d{4}$/.exec(period || '')?.[1] || null;

const formatDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const nextDay = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// "15 Apr 2026 – 14 Jul 2026" for back-to-back admission-date periods, split where there's a gap
function describeDateRanges(items) {
  const sorted = [...items].sort((a, b) => a.period_start.localeCompare(b.period_start));
  const blocks = [];
  for (const item of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && nextDay(last.end) === item.period_start) {
      last.end = item.period_end;
    } else {
      blocks.push({ start: item.period_start, end: item.period_end });
    }
  }
  return blocks.map(b => `${formatDay(b.start)} – ${formatDay(b.end)}`).join(', ');
}

// "Apr–Jun, Aug" for monthly periods; anything else (yearly etc.) is listed as is
function describeMonths(items) {
  const monthIdx = [...new Set(items.map(i => MONTH_ORDER.indexOf(monthOf(i.pay_period))))].sort((a, b) => a - b);
  const runs = [];
  for (const idx of monthIdx) {
    const last = runs[runs.length - 1];
    if (last && idx === last.end + 1) last.end = idx;
    else runs.push({ start: idx, end: idx });
  }
  return runs.map(r => r.start === r.end ? MONTH_ORDER[r.start] : `${MONTH_ORDER[r.start]}–${MONTH_ORDER[r.end]}`).join(', ');
}

function describePeriods(items) {
  const dated = items.filter(i => i.period_start && i.period_end && !i.is_late_fee);
  const monthly = items.filter(i => !dated.includes(i) && monthOf(i.pay_period));
  const other = items.filter(i => !dated.includes(i) && !monthly.includes(i));

  return [
    dated.length ? describeDateRanges(dated) : '',
    monthly.length ? describeMonths(monthly) : '',
    [...new Set(other.map(i => i.period_key || i.pay_period).filter(Boolean))].join(', '),
  ].filter(Boolean).join(', ');
}

// One row per fee head (all late fees together), with the periods it covers
function groupReceiptItems(items) {
  const sortKey = (i) => MONTH_ORDER.indexOf(monthOf(i.pay_period));
  const groups = new Map();

  for (const item of [...items].sort((a, b) => sortKey(a) - sortKey(b))) {
    const key = item.is_late_fee ? '__late_fee__' : item.fee_head_name;
    if (!groups.has(key)) {
      groups.set(key, { name: item.is_late_fee ? 'Late Fee' : item.fee_head_name, items: [], amount: 0, prev_paid: 0, discount: 0, paid: 0 });
    }
    const g = groups.get(key);
    g.items.push(item);
    g.amount += Number(item.amount || 0);
    g.prev_paid += Number(item.prev_paid || 0);
    g.discount += Number(item.discount || 0);
    g.paid += Number(item.amount_paid || 0);
  }

  return [...groups.values()].map(g => ({
    ...g,
    periods: describePeriods(g.items),
    balance: Math.max(g.amount - g.prev_paid - g.discount - g.paid, 0),
  }));
}

// Build receipt HTML: two copies (Parent / Office) on one A4 sheet
export function buildReceiptHtml(paymentData) {
  const {
    school,
    payment,
    student,
    items = []
  } = paymentData;

  const rows = groupReceiptItems(items);
  const totals = rows.reduce((acc, r) => ({
    amount: acc.amount + r.amount,
    prev_paid: acc.prev_paid + r.prev_paid,
    discount: acc.discount + r.discount,
    paid: acc.paid + r.paid,
    balance: acc.balance + r.balance,
  }), { amount: 0, prev_paid: 0, discount: 0, paid: 0, balance: 0 });

  const rowsHtml = rows.map((r, index) => `
        <tr>
          <td>${index + 1}</td>
          <td class="particulars">${esc(r.name)}${r.periods ? ` <span class="periods">(${esc(r.periods)})</span>` : ''}</td>
          <td>${money(r.amount)}</td>
          <td>${money(r.prev_paid)}</td>
          <td>${money(r.discount)}</td>
          <td class="strong">${money(r.paid)}</td>
          <td>${money(r.balance)}</td>
        </tr>`).join('');

  const receiptDate = new Date(payment.created_at).toLocaleDateString('en-IN');
  const classText = `${student.class_name ?? ''}${student.section_name ? `-${student.section_name}` : ''}${student.roll_no ? ` (Roll No: ${student.roll_no})` : ''}`;
  const method = formatMethod(payment.method);
  const generatedOn = `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  const renderCopy = (copyLabel) => `
  <div class="receipt-copy">
    <div class="receipt-header">
      <div class="school-logo">${school.logo ? esc(school.logo) : '🏫'}</div>
      <div class="school-info">
        <div class="school-name">${esc(school.name)}</div>
        ${school.address ? `<div class="school-details">${esc(school.address)}</div>` : ''}
      </div>
    </div>

    <div class="receipt-title-section">
      <span class="receipt-title">FEE RECEIPT</span>
      <span class="copy-label">${copyLabel}</span>
    </div>

    <div class="info-section">
      <div class="info-row"><span class="info-label">Receipt No:</span><span class="info-value strong">${esc(payment.receipt_no)}</span></div>
      <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${esc(receiptDate)}</span></div>
      <div class="info-row"><span class="info-label">Name:</span><span class="info-value strong">${esc(student.name)}</span></div>
      <div class="info-row"><span class="info-label">Admission No:</span><span class="info-value">${esc(student.adm_no)}</span></div>
      <div class="info-row"><span class="info-label">Father's Name:</span><span class="info-value">${esc(student.father_name || '-')}</span></div>
      <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${esc(classText)}</span></div>
      <div class="info-row"><span class="info-label">Mother's Name:</span><span class="info-value">${esc(student.mother_name || '-')}</span></div>
      <div class="info-row"><span class="info-label">Mobile No:</span><span class="info-value">${esc(student.mobile_no || '-')}</span></div>
    </div>

    <table class="payment-table">
      <thead>
        <tr>
          <th style="width: 28px;">Sr.</th>
          <th>Particulars</th>
          <th style="width: 62px;">Amount</th>
          <th style="width: 62px;">Prev. Paid</th>
          <th style="width: 58px;">Discount</th>
          <th style="width: 62px;">Paid</th>
          <th style="width: 62px;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="totals-row">
          <td colspan="2">Total</td>
          <td>${money(totals.amount)}</td>
          <td>${money(totals.prev_paid)}</td>
          <td>${money(totals.discount)}</td>
          <td>₹${money(totals.paid)}</td>
          <td>${money(totals.balance)}</td>
        </tr>
      </tbody>
    </table>

    <div class="table-footer">
      <div class="footer-line">
        <span class="label">Received:</span> ${esc(amountInWords(totals.paid))}
      </div>
      <div class="footer-line split">
        <div class="payment-info-row">
          ${method ? `<span><span class="label">Mode:</span> ${esc(method)}</span>` : ''}
          ${payment.transaction_id ? `<span><span class="label">Txn ID:</span> ${esc(payment.transaction_id)}</span>` : ''}
          ${payment.discount_description ? `<span><span class="label">Discount:</span> ${esc(payment.discount_description)}</span>` : ''}
        </div>
        <div class="signature">(Accounts)</div>
      </div>
    </div>

    <div class="receipt-footer">
      ${totals.prev_paid > 0 ? 'Prev. Paid includes earlier payments and discounts on these fees. ' : ''}Computer-generated receipt · Generated on ${esc(generatedOn)} · Powered by <strong>FeeTrack</strong>
    </div>
  </div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fee Receipt - ${esc(payment.receipt_no)}</title>
  <style>
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page { size: A4; margin: 10mm; }
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Arial', sans-serif;
      background: #fff;
      color: #000;
    }

    .receipt-container { max-width: 190mm; margin: 0 auto; }

    /* Each copy stays whole; if both don't fit, the office copy moves to the next page */
    .receipt-copy { break-inside: avoid; page-break-inside: avoid; }

    .cut-line {
      margin: 14px 0;
      border-top: 1px dashed #666;
      text-align: center;
      line-height: 0;
    }
    .cut-line span { background: #fff; padding: 0 8px; font-size: 11px; color: #666; }

    .receipt-header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      padding: 6px;
      background: #f0f0f0;
    }
    .school-logo {
      width: 44px; height: 44px;
      border: 2px solid #000; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .school-info { text-align: center; }
    .school-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
    .school-details { font-size: 11px; font-weight: 500; }

    .receipt-title-section {
      position: relative;
      text-align: center;
      margin: 6px 0 8px;
    }
    .receipt-title { font-size: 13px; font-weight: bold; text-decoration: underline; }
    .copy-label {
      position: absolute; right: 0; top: 0;
      font-size: 10px; font-weight: bold; letter-spacing: 1px;
      border: 1px solid #000; padding: 1px 6px;
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 24px;
      margin-bottom: 8px;
      font-size: 11px;
    }
    .info-row { display: flex; gap: 8px; }
    .info-label { font-weight: bold; width: 92px; flex-shrink: 0; }
    .info-value { flex: 1; }
    .strong { font-weight: bold; }

    .payment-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .payment-table th {
      background: #f0f0f0;
      border: 1px solid #000;
      padding: 4px 3px;
      text-align: center;
      font-weight: bold;
    }
    .payment-table td { border: 1px solid #000; padding: 3px 4px; text-align: right; }
    .payment-table td:first-child { text-align: center; }
    .payment-table td.particulars { text-align: left; padding-left: 6px; }
    .periods { font-size: 10px; color: #333; }
    .totals-row td { font-weight: bold; background: #f0f0f0; }
    .totals-row td:first-child { text-align: left; padding-left: 6px; }

    .table-footer {
      border: 1px solid #000;
      border-top: none;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
    }
    .footer-line .label { font-weight: bold; }
    .footer-line.split { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
    .payment-info-row { display: flex; flex-wrap: wrap; gap: 4px 16px; }
    .signature { font-weight: bold; padding-top: 14px; white-space: nowrap; }

    .receipt-footer { margin-top: 4px; text-align: center; font-size: 9px; color: #666; }

    .print-button {
      position: fixed;
      top: 30px;
      right: 30px;
      background: indigo;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 24px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s;
    }
    .print-button:hover { transform: translateY(-2px); }
    @media (max-width: 600px) { .print-button { display: none; } }
  </style>
</head>
<body>
  <div class="receipt-container">
    ${renderCopy('PARENT COPY')}
    <div class="cut-line"><span>✂ cut here</span></div>
    ${renderCopy('OFFICE COPY')}
  </div>

  <button class="print-button no-print" onclick="window.print()">
    🖨️ Print Receipt
  </button>
</body>
</html>
  `;
}


const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Call this synchronously in the click handler, before any await. Browsers only allow
// window.open during a user click; opening it after a network request gets it blocked,
// which forces the much slower html2canvas PDF fallback. Returns null on mobile.
export function openReceiptWindow() {
  if (isMobileDevice()) return null;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write('<p style="font-family:sans-serif;padding:24px;color:#555">Preparing receipt…</p>');
  }
  return win;
}

// BEST SOLUTION: Works perfectly on both Desktop & Mobile
export async function downloadReceipt(paymentData, printWindow = null) {
  if (isMobileDevice()) {
    // Mobile: Use jsPDF for direct download
    return await generatePdfDirectly(paymentData);
  } else {
    // Desktop: Use native print (better quality)
    return openPrintDialog(paymentData, printWindow);
  }
}

// For Desktop: Native print dialog
function openPrintDialog(paymentData, existingWindow) {
  const html = buildReceiptHtml(paymentData);
  const fileName = `${paymentData.payment.receipt_no}_${paymentData.student.name}`;

  const printWindow = existingWindow && !existingWindow.closed ? existingWindow : window.open('', '_blank');

  if (!printWindow) {
    // Fallback to direct PDF if popup blocked
    return generatePdfDirectly(paymentData);
  }
  printWindow.document.open();
  // Inject HTML with enhanced print styles
  const enhancedHtml = html.replace(
    '<style>',
    `<style>
    @page { 
      size: A4;
      margin: 0;
    }
    `
  );
  
  printWindow.document.write(enhancedHtml);
  printWindow.document.title = fileName;
  printWindow.document.close();
  
  printWindow.onload = function() {
    printWindow.focus();
  };
  
  return Promise.resolve('print-dialog-opened');
}

// For Mobile: Direct PDF generation and download
async function generatePdfDirectly(paymentData) {
  // Dynamically import libraries
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  
  const html = buildReceiptHtml(paymentData);
  const fileName = `${paymentData.payment.receipt_no}_${paymentData.student.name}.pdf`;
  
  // Create temporary container with fixed width
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '794px'; // A4 width at 96 DPI
  tempDiv.style.padding = '16px';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);
  
  try {
    // Wait for styles and images to load
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capture with html2canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight,
      windowWidth: 794,
      windowHeight: tempDiv.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Calculate dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    // Scale down (never crop) when the receipt is taller than one page
    const fullHeight = (canvas.height * pdfWidth) / canvas.width;
    const scale = Math.min(1, pdfHeight / fullHeight);
    const imgWidth = pdfWidth * scale;
    const imgHeight = fullHeight * scale;

    pdf.addImage(imgData, 'JPEG', (pdfWidth - imgWidth) / 2, 0, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(fileName);
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    return 'pdf-downloaded';
    
  } catch (error) {
    console.error('PDF generation error:', error);
    document.body.removeChild(tempDiv);
    throw error;
  }
}

// ALTERNATIVE: If you want to show a preview first (mobile-friendly)
export async function previewAndDownloadReceipt(paymentData) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  
  const html = buildReceiptHtml(paymentData);
  const fileName = `${paymentData.payment.receipt_no}_${paymentData.student.name}.pdf`;
  
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '794px';
  tempDiv.style.padding = '16px';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const pdfWidth = 210;
    const pdfHeight = 297;
    // Scale down (never crop) when the receipt is taller than one page
    const fullHeight = (canvas.height * pdfWidth) / canvas.width;
    const scale = Math.min(1, pdfHeight / fullHeight);
    const imgWidth = pdfWidth * scale;
    const imgHeight = fullHeight * scale;

    pdf.addImage(imgData, 'JPEG', (pdfWidth - imgWidth) / 2, 0, imgWidth, imgHeight);
    
    // Create blob for preview
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      // Use Web Share API on mobile (if available)
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      try {
        await navigator.share({
          files: [file],
          title: `Fee Receipt ${paymentData.student.name}`,
          text: `Receipt ${paymentData.payment.receipt_no}`
        });
      } catch (err) {
        // If share fails, download instead
        downloadBlob(pdfBlob, fileName);
      }
    } else {
      // Desktop or mobile without share API: preview + download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      
      // Optional: Also open preview
      // window.open(blobUrl, '_blank');
    }
    
    // Cleanup
    document.body.removeChild(tempDiv);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    
    return 'pdf-generated';
    
  } catch (error) {
    console.error('PDF generation error:', error);
    document.body.removeChild(tempDiv);
    throw error;
  }
}

// Helper function to download blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// BONUS: React component example with loading state
export function ReceiptDownloadButton({ paymentData, children }) {
  const [loading, setLoading] = React.useState(false);
  
  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadReceipt(paymentData);
    } catch (error) {
      alert('Failed to generate receipt. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleDownload} 
      disabled={loading}
      style={{
        padding: '12px 24px',
        background: loading ? '#ccc' : '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '16px'
      }}
    >
      {loading ? 'Generating PDF...' : children || 'Download Receipt'}
    </button>
  );
}