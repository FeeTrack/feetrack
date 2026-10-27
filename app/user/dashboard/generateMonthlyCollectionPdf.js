// Builds the month-wise billed / collected / pending report as a text-based A4 PDF.
// jsPDF's built-in fonts have no ₹ glyph, so amounts are plain numbers and the
// currency is stated once above the table.

const formatAmount = (value) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export async function generateMonthlyCollectionPdf({ schoolName, sessionName, monthlyData }) {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = 210;
    const left = 20;
    const right = pageWidth - 20;
    // Column boundaries for the grid; text sits 3mm inside its cell
    const columnEdges = [left, 60, 103, 148, right];
    const columns = [
        { header: 'Month', x: columnEdges[0] + 3, align: 'left' },
        { header: 'Billed', x: columnEdges[2] - 3, align: 'right' },
        { header: 'Collected', x: columnEdges[3] - 3, align: 'right' },
        { header: 'Pending', x: columnEdges[4] - 3, align: 'right' },
    ];

    // Header
    let y = 22;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    const nameLines = pdf.splitTextToSize(schoolName || '', right - left);
    pdf.text(nameLines, pageWidth / 2, y, { align: 'center' });
    y += nameLines.length * 8;

    pdf.setFontSize(13);
    pdf.text('Monthly Fee Collection Report', pageWidth / 2, y, { align: 'center' });
    y += 6;

    const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`Session: ${sessionName}   |   Generated on: ${generatedOn}`, pageWidth / 2, y, { align: 'center' });
    y += 4;

    pdf.setDrawColor(90, 75, 218);
    pdf.setLineWidth(0.6);
    pdf.line(left, y, right, y);
    y += 9;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Amounts in INR', right, y, { align: 'right' });
    y += 2;

    // Table header
    const rowHeight = 8;
    const tableTop = y;
    const rowLines = [y];
    pdf.setFillColor(237, 233, 254);
    pdf.rect(left, y, right - left, rowHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    columns.forEach(col => pdf.text(col.header, col.x, y + 5.5, { align: col.align }));
    y += rowHeight;
    rowLines.push(y);

    // Rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);
    monthlyData.forEach(d => {
        const cells = [d.payPeriod.replace('-', ' '), formatAmount(d.billed), formatAmount(d.collected), formatAmount(d.pending)];
        cells.forEach((cell, c) => pdf.text(cell, columns[c].x, y + 5.5, { align: columns[c].align }));
        y += rowHeight;
        rowLines.push(y);
    });

    // Totals
    const totals = monthlyData.reduce((acc, d) => ({
        billed: acc.billed + d.billed,
        collected: acc.collected + d.collected,
        pending: acc.pending + d.pending,
    }), { billed: 0, collected: 0, pending: 0 });

    pdf.setFillColor(243, 244, 246);
    pdf.rect(left, y, right - left, rowHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const totalCells = ['Total', formatAmount(totals.billed), formatAmount(totals.collected), formatAmount(totals.pending)];
    totalCells.forEach((cell, c) => pdf.text(cell, columns[c].x, y + 5.5, { align: columns[c].align }));
    y += rowHeight;
    rowLines.push(y);

    // Grid: every row and column bordered, like a spreadsheet
    pdf.setDrawColor(75, 85, 99);
    pdf.setLineWidth(0.2);
    rowLines.forEach(lineY => pdf.line(left, lineY, right, lineY));
    columnEdges.forEach(x => pdf.line(x, tableTop, x, y));

    pdf.save(`Monthly_Collection_${sessionName}.pdf`);
}
