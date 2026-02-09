import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { currency, formatPL, todayISO } from "./format";

const configurePolishFont = (doc) => {
  // jsPDF domyślnie obsługuje podstawowe polskie znaki
};

export const generateCostingPDF = (data) => {
  console.log("🎨 NOWA WERSJA GENERATORA PDF!");
  
  const {
    company,
    buyer,
    lines,
    rates,
    summary,
    date = todayISO(),
    number = `W/${new Date().getFullYear()}/${Date.now()}`,
  } = data;

  const doc = new jsPDF();
  const pageWidth = 210;
  let yPos = 15;

  // ========== NAGŁÓWEK Z CZERWONYM PASKIEM ==========
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(company.sellerName || "LOFTDESK", 15, 15);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company.sellerAddress || "", 15, 22);
  doc.text(`NIP: ${company.sellerNip || ""}  |  Tel: ${company.sellerPhone || ""}  |  ${company.sellerEmail || ""}`, 15, 27);
  
  doc.setTextColor(0, 0, 0);
  yPos = 45;

  // ========== TYTUŁ WYCENY ==========
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text("WYCENA", pageWidth / 2, yPos, { align: "center" });

  yPos += 8;
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Numer: ${number}`, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 5;
  doc.text(`Data: ${formatPL(date)}`, pageWidth / 2, yPos, { align: "center" });

  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // ========== DANE W DWÓCH KOLUMNACH (PUDEŁKA) ==========
  
  // LEWA - Nabywca
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos - 3, 85, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, yPos - 3, 85, 38, 3, 3, 'S');
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text("NABYWCA", 20, yPos);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  yPos += 6;
  doc.text(buyer.name || "—", 20, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (buyer.address) {
    yPos += 4;
    const addrLines = doc.splitTextToSize(buyer.address, 75);
    doc.text(addrLines, 20, yPos);
    yPos += addrLines.length * 4;
  }
  if (buyer.nip) {
    yPos += 4;
    doc.text(`NIP: ${buyer.nip}`, 20, yPos);
  }
  if (buyer.phone) {
    yPos += 4;
    doc.text(`Tel: ${buyer.phone}`, 20, yPos);
  }

  // PRAWA - Sprzedawca
  let yPosRight = yPos - 30;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(110, yPosRight - 3, 85, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, yPosRight - 3, 85, 38, 3, 3, 'S');
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text("SPRZEDAWCA", 115, yPosRight);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  yPosRight += 6;
  doc.text(company.sellerName, 115, yPosRight);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  yPosRight += 4;
  const sellerAddrLines = doc.splitTextToSize(company.sellerAddress, 75);
  doc.text(sellerAddrLines, 115, yPosRight);
  yPosRight += sellerAddrLines.length * 4;
  yPosRight += 4;
  doc.text(`NIP: ${company.sellerNip}`, 115, yPosRight);

  yPos += 20;

  // ========== TABELA POZYCJI ==========
  const tableData = lines.map((line, idx) => {
    const rate = rates[line.code];
    if (!rate) return [];

    const net = rate.priceNet * line.qty;
    const vatAmt = net * rate.vat;
    const gross = net + vatAmt;

    return [
      idx + 1,
      rate.name + (line.note ? `\n${line.note}` : ""),
      line.qty.toFixed(2),
      rate.unit,
      currency(rate.priceNet),
      `${Math.round(rate.vat * 100)}%`,
      currency(net),
      currency(vatAmt),
      currency(gross),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Lp.",
        "Nazwa uslugi",
        "Ilosc",
        "J.m.",
        "Cena netto",
        "VAT",
        "Wartosc netto",
        "Kwota VAT",
        "Wartosc brutto",
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 52 },
      2: { halign: "right", cellWidth: 14 },
      3: { halign: "center", cellWidth: 11 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "center", cellWidth: 11 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "right", cellWidth: 20 },
      8: { halign: "right", cellWidth: 24 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  // ========== PODSUMOWANIE W ZAOKRĄGLONYM PUDEŁKU ==========
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, finalY, 75, 38, 3, 3, 'F');
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.roundedRect(120, finalY, 75, 38, 3, 3, 'S');

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  let summaryY = finalY + 8;
  doc.text("Razem netto:", 125, summaryY);
  doc.setFont("helvetica", "bold");
  doc.text(currency(summary.net), 190, summaryY, { align: "right" });

  summaryY += 7;
  doc.setFont("helvetica", "normal");
  doc.text("Razem VAT:", 125, summaryY);
  doc.setFont("helvetica", "bold");
  doc.text(currency(summary.vat), 190, summaryY, { align: "right" });

  summaryY += 10;
  doc.setFontSize(13);
  doc.setTextColor(220, 38, 38);
  doc.text("DO ZAPLATY:", 125, summaryY);
  doc.text(currency(summary.gross), 190, summaryY, { align: "right" });

  doc.setTextColor(0, 0, 0);

  // DODATKOWE INFO
  summaryY += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(`Szacunkowy koszt materialow: ${currency(summary.materials)}`, 125, summaryY);

  // ========== STOPKA ==========
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Wycena ma charakter informacyjny. Ostateczna cena moze ulec zmianie po wizji lokalnej.",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  if (company.iban) {
    doc.text(
      `Numer konta: ${company.iban}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // UNIKALNY TIMESTAMP W NAZWIE
  const timestamp = Date.now();
  const fileName = `Wycena_${number.replace(/\//g, "_")}_${timestamp}.pdf`;
  doc.save(fileName);
  
  console.log("✅ PDF wygenerowany:", fileName);
};

export const generateInvoicePDF = (invoice, company) => {
  const doc = new jsPDF();
  configurePolishFont(doc);

  let yPos = 20;

  // NAGŁÓWEK
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(company.sellerName || "LOFTDESK", 20, yPos);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(company.sellerAddress || "", 20, yPos);
  
  yPos += 5;
  doc.text(`NIP: ${company.sellerNip || ""}`, 20, yPos);
  
  yPos += 5;
  doc.text(`Tel: ${company.sellerPhone || ""}`, 20, yPos);
  
  yPos += 5;
  doc.text(`Email: ${company.sellerEmail || ""}`, 20, yPos);

  // TYTUŁ
  yPos = 20;
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("FAKTURA VAT", 190, yPos, { align: "right" });
  
  yPos += 8;
  doc.setFontSize(12);
  doc.text(invoice.number, 190, yPos, { align: "right" });

  // DANE FAKTURY
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  
  doc.text("Data wystawienia:", 130, yPos);
  doc.text(formatPL(invoice.issueDate), 190, yPos, { align: "right" });
  
  yPos += 5;
  doc.text("Data sprzedazy:", 130, yPos);
  doc.text(formatPL(invoice.saleDate), 190, yPos, { align: "right" });
  
  yPos += 5;
  doc.text("Termin platnosci:", 130, yPos);
  doc.text(formatPL(invoice.dueDate), 190, yPos, { align: "right" });
  
  yPos += 5;
  doc.text("Sposob platnosci:", 130, yPos);
  doc.text(invoice.paymentMethod, 190, yPos, { align: "right" });

  // NABYWCA
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Nabywca:", 20, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(invoice.buyer.name, 20, yPos);

  if (invoice.buyer.address) {
    yPos += 5;
    doc.text(invoice.buyer.address, 20, yPos);
  }

  if (invoice.buyer.nip) {
    yPos += 5;
    doc.text(`NIP: ${invoice.buyer.nip}`, 20, yPos);
  }

  // TABELA
  yPos += 10;

  const tableData = invoice.lines.map((line, idx) => {
    const net = line.priceNet * line.qty;
    const vatAmt = net * line.vat;
    const gross = net + vatAmt;

    return [
      idx + 1,
      line.name,
      line.qty.toFixed(2),
      line.unit,
      currency(line.priceNet),
      `${Math.round(line.vat * 100)}%`,
      currency(net),
      currency(vatAmt),
      currency(gross),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Lp.",
        "Nazwa",
        "Ilosc",
        "J.m.",
        "Cena netto",
        "VAT",
        "Wartosc netto",
        "Kwota VAT",
        "Wartosc brutto",
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { halign: "right", cellWidth: 15 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "center", cellWidth: 12 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "right", cellWidth: 20 },
      8: { halign: "right", cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // PODSUMOWANIE
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");

  const summaryX = 130;
  let summaryY = finalY;

  doc.text("Razem netto:", summaryX, summaryY);
  doc.text(currency(invoice.summary.net), 190, summaryY, { align: "right" });

  summaryY += 6;
  doc.text("Razem VAT:", summaryX, summaryY);
  doc.text(currency(invoice.summary.vat), 190, summaryY, { align: "right" });

  summaryY += 8;
  doc.setFontSize(13);
  doc.text("DO ZAPLATY:", summaryX, summaryY);
  doc.text(currency(invoice.summary.gross), 190, summaryY, { align: "right" });

  // NOTATKI
  if (invoice.notes) {
    summaryY += 15;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Uwagi:", 20, summaryY);
    summaryY += 5;
    doc.setFont(undefined, "normal");
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, summaryY);
  }

  // STOPKA
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(100);

  if (company.iban) {
    doc.text(
      `Numer konta: ${company.iban}`,
      105,
      pageHeight - 20,
      { align: "center" }
    );
  }

  doc.text(
    "Dziekujemy za skorzystanie z naszych uslug!",
    105,
    pageHeight - 15,
    { align: "center" }
  );

  const fileName = `Faktura_${invoice.number.replace(/\//g, "_")}.pdf`;
  doc.save(fileName);
};