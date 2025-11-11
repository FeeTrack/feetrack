// utils/receipt/buildReceipt.js
// Optimized space-efficient receipt builder
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

// Build optimized receipt HTML
export function buildReceiptHtml(paymentData) {
  const {
    school,
    payment,
    student,
    items = []
  } = paymentData;
  
  // Calculate amounts
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const totalPaid = items.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  
  // Build items rows
  const itemsHtml = items.map((item, index) => 
    `<tr>
        <td>${index + 1}</td>
        <td>${item.is_late_fee ? `Late Fee - ${item.fee_head_name}` : `${item.fee_head_name}`}</td>
        <td>${item.period_key || '-'}</td>
        <td>${item.amount}</td>
        <td>${item.discount}</td>
        <td>${item.amount_paid}</td>
      </tr>
    `).join('');
  
  const amountInWords = numberToWords(Math.floor(totalPaid)) + ' Rupees Only';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fee Receipt - ${payment.receipt_no}</title>
  <style>
    @media print {
        * {
            -webkit-print-color-adjust: exact !important; /* Chrome, Edge */
            color-adjust: exact !important;               /* Firefox */
            print-color-adjust: exact !important;         /* New standard */
        }
        @page { 
            size: A4;
            margin: 0;
        }
        body { 
            margin: 0; 
            padding: 16px; 
        }
        .no-print { display: none; }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: #fff;
      color: #000;
    }
    
    .receipt-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
    }
    
    .receipt-header {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 8px;
      margin-bottom: 8px;
      background: #f0f0f0;
    }
    
    .school-logo {
      width: 60px;
      height: 60px;
      border: 2px solid #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      flex-shrink: 0;
    }
    
    .school-info {
      max-width: fit-content;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2px;
    }
    
    .school-name {
      font-size: 24px;
      font-weight: bold;
      text-transform: capitalize;
    }
    
    .school-tagline {
      font-size: 12px;
      font-style: italic;
      color: #333;
    }
    
    .school-details {
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      color: #000;
    }
    
    .receipt-title-section {
      text-align: center;
      margin-bottom: 12px;
    }
    
    .receipt-title {
      font-size: 14px;
      font-weight: bold;
      text-decoration: underline;
    }
    
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 30px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    
    .info-row {
      display: flex;
      gap: 12px;
    }
    
    .info-label {
      font-weight: bold;
      width: 100px;
      max-width: 150px;
    }
    
    .info-value {
      flex: 1;
    }
    
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: 11px;
    }
    
    .payment-table th {
      background: #f0f0f0;
      border: 1px solid #000;
      padding: 6px 4px;
      text-align: center;
      font-weight: bold;
    }
    
    .payment-table td {
      border: 1px solid #000;
      padding: 4px;
      text-align: center;
    }
    
    .payment-table td:nth-child(2) {
      text-align: left;
      padding-left: 8px;
    }

    td.totalsTd {
      text-align: center;
    }
    
    .table-footer {
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      gap:10px;
    }
    
    .amount-words-row {
      padding: 2px 12px;
      font-size: 11px;
    }
    
    .amount-words-label {
      font-weight: bold;
      display: inline;
    }
    
    .amount-words-text {
      display: inline;
      text-transform: capitalize;
    }
    
    .payment-info-row {
      font-size: 11px;
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .payment-info-item {
      display: flex;
      gap: 4px;
    }
    
    .payment-info-item strong {
      font-weight: bold;
    }

    .final-section-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 12px;
      font-size: 11px;
    }
    
    .receipt-footer {
      margin-top: 8px;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    
    @media max-width: 600px {
        .print-button { display: none; }
    }
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
    
    .print-button:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="receipt-header">
      <div class="school-logo">${school.logo || '🏫'}</div>
      <div class="school-info">
        <div class="school-name">${school.name}</div>
        <div class="school-tagline">${school.tagline || ''}</div>
        <div class="school-details">
          ${school.address || ''}
        </div>
      </div>
    </div>
    
    <!-- Receipt Title -->
    <div class="receipt-title-section">
      <div class="receipt-title">FEE RECEIPT</div>
    </div>
    
    <!-- Receipt Meta & Student Info -->
    <div class="info-section">
      <!-- Receipt Meta -->
      <div class="info-row">
        <span class="info-label">Receipt No:</span>
        <span class="info-value">${payment.receipt_no}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${new Date(payment.created_at).toLocaleDateString('en-IN')}</span>
      </div>
            
      <!-- Student Info -->
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span class="info-value">${student.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Admission No:</span>
        <span class="info-value">${student.adm_no}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Father's Name:</span>
        <span class="info-value">${student.father_name || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Class:</span>
        <span class="info-value">${student.class_name}${student.section_name ? `-${student.section_name}` : ''}${student.roll_no ? ` (Roll No: ${student.roll_no})` : ''}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Mother's Name:</span>
        <span class="info-value">${student.mother_name || '-'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Mobile No:</span>
        <span class="info-value">${student.mobile_no || '-'}</span>
      </div>

    </div>
    
    <!-- Payment Table -->
    <table class="payment-table">
      <thead>
        <tr>
          <th style="width: 40px;">Sr.</th>
          <th style="width: auto;">Fee Description</th>
          <th style="width: 80px;">Period</th>
          <th style="width: 60px;">Amount</th>
          <th style="width: 60px;">Discount</th>
          <th style="width: 60px;">Paid</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="font-weight: 600; background: #f0f0f0;">
          <td colspan="2" style="border-right: none; border-bottom:none;">Totals</td>
          <td class="totalsTd" style="border:none;"></td>
          <td class="totalsTd" style="border:none;">${(totalAmount)}</td>
          <td class="totalsTd" style="border:none;">${totalDiscount > 0 ? (totalDiscount) : '0'}</td>
          <td class="totalsTd" style="border-left:none; border-bottom:none;">${(totalPaid)}</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Table Footer -->
    <div class="table-footer">

      <!-- Amount in Words -->
      <div class="amount-words-row">
        <span class="amount-words-label">Received: </span>
        <span class="amount-words-text">${amountInWords}</span>
      </div>
      
      <!-- Payment Info -->

      <div class="final-section-line">
        <div class="payment-info-row">
          ${payment.method ? `
          <div class="payment-info-item">
            <strong>Payment Method:</strong>
            <span>${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</span>
          </div>
          ` : ''}
          ${payment.discount_description ? `
          <div class="payment-info-item">
            <strong>Discount Description:</strong>
            <span>${payment.discount_description}</span>
          </div>
          ` : ''}
        </div>
        
        <div><strong>(Accounts)</strong></div>
      </div>

    </div>
    
    <!-- Footer -->
    <div class="receipt-footer">
      <p>
        <strong>Note:</strong> This is a computer-generated receipt. 
        Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p>
          Powered by <strong><a href="https://krishnaupadhyay.vercel.app" target="_blank" style="color: #364153; text-decoration: none;">FeeTrack</a></strong>
      </p>
    </div>
  </div>
  
  <!-- Print Button -->
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Print Receipt
  </button>
</body>
</html>
  `;
}

// Print receipt HTML
// export function printHtmlReceipt(html) {
//   const printWindow = window.open('', '_blank');
//   if (!printWindow) {
//     alert('Please allow popups to print the receipt');
//     return;
//   }
  
//   printWindow.document.write(html);
//   printWindow.document.close();
  
//   // Wait for content to load, then print
//   printWindow.onload = function() {
//     printWindow.focus();
//     printWindow.print();
//   };
// }

// BEST SOLUTION: Works perfectly on both Desktop & Mobile
export async function downloadReceipt(paymentData) {
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Mobile: Use jsPDF for direct download
    return await generatePdfDirectly(paymentData);
  } else {
    // Desktop: Use native print (better quality)
    return openPrintDialog(paymentData);
  }
}

// For Desktop: Native print dialog
function openPrintDialog(paymentData) {
  const html = buildReceiptHtml(paymentData);
  const fileName = `${paymentData.payment.receipt_no}_${paymentData.student.name}`;
  
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    // Fallback to direct PDF if popup blocked
    return generatePdfDirectly(paymentData);
  }
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
    setTimeout(() => printWindow.print(), 250);
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
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // If content is longer than one page, it will overflow (you can add multi-page logic if needed)
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
    
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
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    
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