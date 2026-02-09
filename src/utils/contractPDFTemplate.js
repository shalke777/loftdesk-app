import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatPL, currency } from "./format";


// ————————————————————————————————————————————————————————————————
//  RENDERER HTML → PDF
// ————————————————————————————————————————————————————————————————
async function renderNodeToPdfMultiPage(node, options = {}) {
  const {
      footerPhone = "",
    footerEmail = "",
    fileName = "dokument.pdf",
    logoBase64 = "", // dodaj to
  } = options;

  if (!node) return;

  // Dodaj node do DOM
  node.style.position = "fixed";
  node.style.left = "-20000px";
  node.style.top = "0";
  node.style.width = "210mm";
  node.style.background = "#ffffff";
  node.style.fontFamily = "Arial, Helvetica, sans-serif";
  node.style.fontSize = "14px";
  
  document.body.appendChild(node);
  
  // Czekaj na renderowanie
  await new Promise((resolve) => setTimeout(resolve, 500));

  const canvas = await html2canvas(node, {
    scale: 4,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    letterRendering: true,
    windowWidth: 794,
    windowHeight: node.scrollHeight,
  });

  document.body.removeChild(node);

  const pdf = new jsPDF({ 
    orientation: "p", 
    unit: "mm", 
    format: "a4",
    compress: true 
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

 // NAGŁÓWEK - czerwony pasek z logo
const headerH = logoBase64 ? 25 : 15; // wyższy jeśli jest logo
const drawHeader = () => {
  pdf.setFillColor(220, 38, 38);
  pdf.rect(0, 0, pageWidth, headerH, "F");
  
  // Dodaj logo jeśli jest
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, "PNG", 10, 5, 15, 15); // lewy górny róg
    } catch (e) {
      console.error("Błąd ładowania logo:", e);
    }
  }
};
  // STOPKA
  const footerH = 12;
  const drawFooter = () => {
    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, pageHeight - footerH, pageWidth, footerH, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(255);
    const text = `${footerPhone || ""}   |   ${footerEmail || ""}`.trim();
    if (text) pdf.text(text, pageWidth / 2, pageHeight - 6, { align: "center" });
  };

  const imgW = pageWidth - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const availableHeight = pageHeight - headerH - footerH - margin * 2;

  let yOffset = 0;
  let first = true;

  while (yOffset < imgH) {
    if (!first) pdf.addPage();
    drawHeader();

    const sourceY = (yOffset * canvas.width) / imgW;
    const sourceHeight = Math.min((availableHeight * canvas.width) / imgW, canvas.height - sourceY);
    
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    
    const ctx = pageCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

    const pageImg = pageCanvas.toDataURL("image/jpeg", 0.95);
    const renderHeight = Math.min(availableHeight, imgH - yOffset);
    
    pdf.addImage(pageImg, "JPEG", margin, margin + headerH, imgW, renderHeight);

    drawFooter();

    yOffset += availableHeight;
    first = false;
  }

  pdf.save(fileName);
}

// ============= WYCENA =============
export const generateCostingPDFFromHTML = async (data, company) => {
  console.log("🔥🔥🔥 WYCENA Z TABELĄ NAGŁÓWKOWĄ 🔥🔥🔥");
  
  const { buyer, lines, rates, summary, date } = data;

  const rows = lines.map((l) => {
    const rate = rates[l.code] || {};
    const unitNet = (rate.mat_price || 0) + (rate.labor_price || 0);
    const net = unitNet * (l.qty || 0);
    const vat = net * 0.08;
    const gross = net + vat;
    return {
      name: rate.name || l.code,
      qty: (l.qty || 0).toFixed(2),
      unit: rate.unit || "j",
      net,
      gross,
      note: l.note || "",
    };
  });

  const node = document.createElement("div");
  
 node.innerHTML = `
  <style>
    @media print {
      .no-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
  <div style="padding: 60px 40px; background: #fff; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7;">
  
    <!-- TYTUŁ WYCENY -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 32px; font-weight: 800; color: #dc2626; margin-bottom: 10px; letter-spacing: 0.5px;">WYCENA</div>
      <div style="font-size: 14px; color: #475569; margin-bottom: 5px;">Numer: W/${new Date(date).getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</div>
      <div style="font-size: 13px; color: #475569;">Data wystawienia: ${formatPL(date)}</div>
    </div>
    
    <!-- TABELA: WYKONAWCA | NABYWCA -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-family: Arial, Helvetica, sans-serif;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 10px;">
          <div style="border: 2px solid #e2e8f0; border-radius: 10px; padding: 15px; background: #f8fafc; min-height: 140px;">
            <div style="font-weight: 700; color: #dc2626; margin-bottom: 10px; font-size: 12px;">WYKONAWCA</div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; line-height: 1.4;">${company.sellerName}</div>
            <div style="color: #475569; font-size: 11px; line-height: 1.6;">
              ${company.sellerAddress}<br>
              ${company.sellerNip}<br>
              ${company.sellerEmail}<br>
              ${company.sellerPhone}
            </div>
          </div>
        </td>
        
        <td style="width: 50%; vertical-align: top; padding-left: 10px;">
          <div style="border: 2px solid #e2e8f0; border-radius: 10px; padding: 15px; background: #f8fafc; min-height: 140px;">
            <div style="font-weight: 700; color: #dc2626; margin-bottom: 10px; font-size: 12px;">NABYWCA</div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; line-height: 1.4;">${buyer.name || "—"}</div>
            <div style="color: #475569; font-size: 11px; line-height: 1.6;">
              ${buyer.address || "—"}<br>
              ${buyer.nip ? `NIP ${buyer.nip}` : "NIP —"}
            </div>
          </div>
        </td>
      </tr>
    </table>
    
    <!-- TABELA POZYCJI -->
    <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-family: Arial, Helvetica, sans-serif;">
      <thead>
        <tr style="background: #dc2626; color: white;">
          <th style="padding: 12px 10px; font-weight: 700; font-size: 12px; border: 1px solid #b91c1c; text-align: left;">Pozycja</th>
          <th style="padding: 12px 10px; font-weight: 700; font-size: 12px; border: 1px solid #b91c1c; text-align: center; width: 80px;">Ilosc</th>
          <th style="padding: 12px 10px; font-weight: 700; font-size: 12px; border: 1px solid #b91c1c; text-align: center; width: 60px;">J.m.</th>
          <th style="padding: 12px 10px; font-weight: 700; font-size: 12px; border: 1px solid #b91c1c; text-align: right; width: 110px;">Netto</th>
          <th style="padding: 12px 10px; font-weight: 700; font-size: 12px; border: 1px solid #b91c1c; text-align: right; width: 110px;">Brutto</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, idx) => `
          <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">${r.name}${r.note ? ` - ${r.note}` : ''}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; text-align: center;">${r.qty}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; text-align: center;">${r.unit}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 600;">${currency(r.net)}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700;">${currency(r.gross)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- PODSUMOWANIE -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
      <tr>
        <td style="width: 60%;"></td>
        <td style="width: 40%;">
          <div style="border: 3px solid #dc2626; border-radius: 12px; padding: 20px; background: #fef2f2;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; font-size: 13px; font-weight: 600;">Razem netto:</td>
                <td style="padding: 5px 0; font-size: 13px; font-weight: 700; text-align: right;">${currency(summary.net)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-size: 13px; font-weight: 600;">Razem VAT (8%):</td>
                <td style="padding: 5px 0; font-size: 13px; font-weight: 700; text-align: right;">${currency(summary.vat)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 700; color: #dc2626; border-top: 2px solid #fecaca;">RAZEM BRUTTO:</td>
                <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 700; text-align: right; color: #dc2626; border-top: 2px solid #fecaca;">${currency(summary.gross)}</td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
    
    <!-- UWAGA -->
    <div style="margin-top: 25px; padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; text-align: center; font-size: 12px; color: #7f1d1d;">
      <strong>Uwaga:</strong> Wycena ma charakter informacyjny. Ostateczna cena moze ulec zmianie po wizji lokalnej.
    </div>
  </div>
`;
await renderNodeToPdfMultiPage(node, {
  headerTitle: "",
  footerPhone: company.sellerPhone,
  footerEmail: company.sellerEmail,
  fileName: `Wycena_${date}.pdf`,
  logoBase64: company.logo || "", // dodaj to
});
};

// ============= FAKTURA =============

export const generateInvoicePDFFromHTML = async (invoice, company) => {
  const node = document.createElement("div");  // ⬅️ TA LINIA MUSI BYĆ!
  
  node.innerHTML = `
    <div style="padding: 50px 40px; background: #fff; font-family: Arial, sans-serif;">     <div style="margin-bottom: 25px;">
  <div>
    <div style="font-size: 30px; font-weight: 800; color: #dc2626;">FAKTURA VAT</div>
    <div style="font-size: 18px; font-weight: 600; margin: 8px 0;">Nr: ${invoice.number}</div>        <div style="font-size: 12px; color: #475569; line-height: 1.7;">
          Data wystawienia: <strong>${formatPL(invoice.issueDate)}</strong><br>
          Data sprzedazy: <strong>${formatPL(invoice.saleDate)}</strong><br>
          Termin platnosci: <strong style="color: #dc2626;">${formatPL(invoice.dueDate)}</strong><br>
          Sposob platnosci: <strong>${invoice.paymentMethod}</strong>
        </div>
        </div>
      </div>
      
      <div style="margin-bottom: 30px; overflow: hidden;">
  <div style="width: 48%; float: left; margin-right: 4%;">
    <div style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px; background: #f8fafc; height: 140px; display: flex; flex-direction: column;">
      <div style="font-weight: 700; color: #dc2626; margin-bottom: 10px; font-size: 12px;">SPRZEDAWCA</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${company.sellerName}</div>
        <div style="color: #475569; font-size: 12px; line-height: 1.6;">
          ${company.sellerAddress}<br>
          ${company.sellerNip}<br>
          ${company.sellerEmail}<br>
          ${company.sellerPhone}
        </div>
      </div>
    </div>
  </div>
  
  <div style="width: 48%; float: left;">
    <div style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px; background: #f8fafc; height: 140px; display: flex; flex-direction: column;">
      <div style="font-weight: 700; color: #dc2626; margin-bottom: 10px; font-size: 12px;">NABYWCA</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${invoice.buyer.name || "—"}</div>
        <div style="color: #475569; font-size: 12px; line-height: 1.6;">
          ${invoice.buyer.address || "—"}<br>
          ${invoice.buyer.nip ? `NIP ${invoice.buyer.nip}` : "NIP —"}
        </div>
      </div>
    </div>
  </div>
  <div style="clear: both;"></div>
</div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background: #dc2626; color: white;">
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: center; width: 30px;">Lp.</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: left;">Nazwa</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: center; width: 50px;">Ilosc</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: center; width: 40px;">J.m.</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: right; width: 70px;">Cena netto</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: center; width: 40px;">VAT</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: right; width: 80px;">Wart. netto</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: right; width: 70px;">Kwota VAT</th>
            <th style="padding: 10px 6px; font-weight: 700; font-size: 10px; border: 1px solid #b91c1c; text-align: right; width: 90px;">Wart. brutto</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lines.map((line, idx) => {
            const net = line.priceNet * line.qty;
            const vatAmt = net * line.vat;
            const gross = net + vatAmt;
            return `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px;">${line.name}${line.note ? ` - ${line.note}` : ''}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: center;">${line.qty.toFixed(2)}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: center;">${line.unit}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: right;">${currency(line.priceNet)}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: center;">${Math.round(line.vat * 100)}%</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: right; font-weight: 600;">${currency(net)}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: right;">${currency(vatAmt)}</td>
                <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-align: right; font-weight: 700;">${currency(gross)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div style="margin: 25px 0 0 auto; width: 350px; border: 3px solid #dc2626; border-radius: 12px; padding: 20px; background: #fef2f2;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
          <span style="font-weight: 600;">Razem netto:</span>
          <span style="font-weight: 700; text-align: right;">${currency(invoice.summary.net)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
          <span style="font-weight: 600;">Razem VAT:</span>
          <span style="font-weight: 700; text-align: right;">${currency(invoice.summary.vat)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #fecaca; font-size: 17px; color: #dc2626;">
          <span style="font-weight: 700;">DO ZAPLATY:</span>
          <span style="font-weight: 700; text-align: right;">${currency(invoice.summary.gross)}</span>
        </div>
      </div>
      
      ${invoice.notes ? `
        <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 10px;">
          <div style="font-weight: 700; margin-bottom: 8px; font-size: 12px;">Uwagi:</div>
          <div style="color: #475569; font-size: 12px;">${invoice.notes}</div>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; text-align: center; font-size: 13px; color: #475569;">
        Numer konta: <strong style="color: #dc2626;">${company.iban}</strong>
      </div>
    </div>
  `;

  await renderNodeToPdfMultiPage(node, {
    headerTitle: `FAKTURA VAT • ${invoice.number}`,
    footerPhone: company.sellerPhone,
    footerEmail: company.sellerEmail,
    fileName: `Faktura_${invoice.number.replace(/\//g, "_")}.pdf`,
     logoBase64: company.logo || "",
  });
};

 
// ============= UMOWA =============
export const generateContractPDFFromHTML = async (contract, company) => {
  const totalNet = contract.totalAmount / 1.08;

  const node = document.createElement("div");
  
  node.innerHTML = `
    <div style="padding: 40px 30px; background: #fff; font-family: Arial, Helvetica, sans-serif;">
      
      <!-- TYTUŁ -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 26px; font-weight: 800; color: #dc2626; margin-bottom: 10px;">UMOWA O WYKONANIE ROBÓT BUDOWLANYCH</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Numer: ${contract.number}</div>
        <div style="font-size: 12px; color: #64748b;">Data podpisania: ${formatPL(contract.contractDate)}</div>
      </div>
      
      <!-- WPROWADZENIE -->
      <p style="margin-bottom: 20px; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
        zawarta w dniu ${formatPL(contract.contractDate)} w ${contract.location || 'Krakowie'} między ${contract.buyer.name} ${contract.buyer.address ? 'zamieszkałym/-ą ' + contract.buyer.address : ''} zwanym/-ą dalej <strong>Inwestorem</strong>, a Firmą <strong>${company.sellerName}</strong>, z siedzibą w ${company.sellerAddress}, ${company.sellerNip}, reprezentowaną przez ${company.sellerName}, zwanego dalej <strong>Wykonawcą</strong>.
      </p>
      
      <!-- § 1 PRZEDMIOT UMOWY -->
      <div style="margin-top: 25px;">
        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 10px 15px; font-weight: 700; font-size: 12px; margin-bottom: 12px; color: #1e293b;">
          § 1 • PRZEDMIOT UMOWY
        </div>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          <strong>1.</strong> Inwestor zleca, a Wykonawca przyjmuje do wykonania roboty wykończeniowe. Szczegółowy zakres prac znajduje się w sporządzonym kosztorysie, stanowiącym załącznik nr 1 do umowy.
        </p>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          <strong>2.</strong> Wykonawca oświadcza, że posiada niezbędne umiejętności, wiedzę, środki, sprzęt i doświadczenie do wykonania prac będących przedmiotem umowy i zobowiązuje się je wykonać z należytą starannością oraz aktualnym poziomem wiedzy i techniki.
        </p>
      </div>
      
      <!-- § 2 TERMIN -->
      <div style="margin-top: 25px;">
        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 10px 15px; font-weight: 700; font-size: 12px; margin-bottom: 12px; color: #1e293b;">
          § 2 • TERMIN I SPOSÓB WYKONANIA UMOWY
        </div>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          <strong>1.</strong> Strony zgodnie ustalają termin rozpoczęcia prac na dzień <strong>${formatPL(contract.contractDate)}</strong>, a termin zakończenia prac na dzień nie później niż <strong style="color: #991b1b;">${formatPL(contract.completionDate)}</strong>.
        </p>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          <strong>2.</strong> Wykonawca wykona umowę samodzielnie lub za pomocą osób przez siebie wskazanych, gwarantujących należyte wykonanie umowy.
        </p>
      </div>
      
      <!-- § 3 WYNAGRODZENIE -->
      <div style="margin-top: 25px;">
        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 10px 15px; font-weight: 700; font-size: 12px; margin-bottom: 12px; color: #1e293b;">
          § 3 • WYNAGRODZENIE
        </div>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          <strong>1.</strong> Za wykonanie umowy Inwestor zapłaci na rzecz Wykonawcy wynagrodzenie zgodne z kosztorysem ofertowym: <strong>${currency(totalNet)}</strong> netto (tj. <strong style="color: #991b1b;">${currency(contract.totalAmount)}</strong> brutto), stanowiącym załącznik nr 1 do umowy.
        </p>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          <strong>2.</strong> Kosztorys nie obejmuje kosztów materiałów poza chemią budowlaną dostarczoną przez Wykonawcę. Pozostałe materiały dostarcza Inwestor.
        </p>
      </div>
      
      <!-- HARMONOGRAM -->
      <div style="margin: 20px 0;">
        <div style="font-weight: 700; margin-bottom: 10px; font-size: 12px; color: #1e293b;">HARMONOGRAM ROZLICZEŃ</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #dc2626;">
              <th style="padding: 10px 8px; font-weight: 700; font-size: 11px; text-align: center; width: 60px; color: #1e293b;">Etap</th>
              <th style="padding: 10px 8px; font-weight: 700; font-size: 11px; text-align: center; width: 70px; color: #1e293b;">Udział</th>
              <th style="padding: 10px 8px; font-weight: 700; font-size: 11px; text-align: right; width: 110px; color: #1e293b;">Kwota</th>
              <th style="padding: 10px 8px; font-weight: 700; font-size: 11px; text-align: left; color: #1e293b;">Termin</th>
            </tr>
          </thead>
          <tbody>
            ${contract.payments.map((payment, idx) => {
              const percentage = ((payment.amount / contract.totalAmount) * 100).toFixed(0);
              return `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; font-size: 10px; text-align: center;">${idx + 1}</td>
                  <td style="padding: 8px; font-size: 10px; text-align: center;">${percentage}%</td>
                  <td style="padding: 8px; font-size: 10px; text-align: right; font-weight: 600;">${currency(payment.amount)}</td>
                  <td style="padding: 8px; font-size: 10px;">${payment.description || formatPL(payment.dueDate)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="margin: 15px 0; padding: 12px; background: #fef2f2; border-left: 4px solid #dc2626; font-size: 11px; color: #7f1d1d;">
        <strong>Numer konta:</strong> <span style="color: #dc2626; font-weight: 700;">${company.iban || 'PL82105015621000009083380163'}</span>
      </div>
      
      <!-- § 4 GWARANCJA -->
      <div style="margin-top: 35px; page-break-before: auto;">
        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 10px 15px; font-weight: 700; font-size: 12px; margin-bottom: 12px; color: #1e293b;">
          § 4 • GWARANCJA
        </div>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          Wykonawca udziela <strong>${contract.warranty || 'dwuletniej'}</strong> gwarancji na wykonane prace budowlane i zobowiązuje się do bezwzględnego usunięcia usterek i wad, które w tym okresie czasu mogą wystąpić z winy Wykonawcy.
        </p>
      </div>
      
      <!-- § 5 OBOWIĄZKI INWESTORA -->
      <div style="margin-top: 35px; page-break-before: auto;">
        <div style="background: #f1f5f9; border-left: 4px solid #dc2626; padding: 10px 15px; font-weight: 700; font-size: 12px; margin-bottom: 12px; color: #1e293b;">
          § 5 • OBOWIĄZKI INWESTORA
        </div>
        <p style="margin: 8px 0; text-align: justify; font-size: 11px; line-height: 1.6; color: #334155;">
          Inwestor zobowiązuje się udostępnić Wykonawcy na czas trwania umowy mieszkanie, w którym mają być wykonywane umówione prace, a także pomieszczenie sanitarne, wodę, prąd i światło. Wykonawca zastrzega sobie prawo do korzystania z lokalu na wyłączność przez okres trwania prac. Inwestor wskaże wykonawcy miejsce składowania odpadów budowlanych przy inwestycji. Wykonawca zastrzega sobie iż koszt zutylizowania odpadów ponosi INWESTOR.
        </p>
      </div>
      
      <!-- PODPISY -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 60px;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: bottom; padding: 0 20px;">
            <div style="border-top: 2px solid #64748b; padding-top: 8px; font-size: 11px; font-weight: 600; color: #475569;">Podpis Inwestora</div>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: bottom; padding: 0 20px;">
            <div style="border-top: 2px solid #64748b; padding-top: 8px; font-size: 11px; font-weight: 600; color: #475569;">Podpis Wykonawcy</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  await renderNodeToPdfMultiPage(node, {
    footerPhone: company.sellerPhone,
    footerEmail: company.sellerEmail,
    fileName: `Umowa_${contract.number.replace(/\//g, "_")}.pdf`,
    logoBase64: company.logo || "",
  });
};