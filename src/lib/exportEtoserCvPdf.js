async function loadImageAsDataUrl(src, size = 256, bgWhite = false) {
  if (!src || typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (bgWhite) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
        }
        // Center-crop / contain nicely
        const ratio = Math.min(size / img.width, size / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        const dx = (size - drawW) / 2;
        const dy = (size - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadAvatarSquareDataUrl(src, size = 256) {
  if (!src || typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fmtScore(val) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '-';
  return Number(val).toFixed(2);
}

function fmtPhone(noHp) {
  if (!noHp) return 'Belum diisi';
  const clean = String(noHp).trim();
  if (clean.startsWith('+62') || clean.startsWith('0')) return clean;
  return `+62 ${clean}`;
}

export async function exportEtoserCvPdf(cvPayload) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;

  const profile = cvPayload?.profile || {};
  const portofolios = cvPayload?.portofolios || [];
  const reli = cvPayload?.reli || { hasData: false, history: [] };
  const monitoring = cvPayload?.monitoring || { hasData: false, history: [], variablesList: [] };

  const [logoDataUrl, avatarDataUrl] = await Promise.all([
    loadImageAsDataUrl('/icons/icon-192x192.png', 200, true),
    profile.foto_profil ? loadAvatarSquareDataUrl(profile.foto_profil, 220) : Promise.resolve(null),
  ]);

  // =========================================================================
  // 1. HEADER BANNER (Dark Navy + Teal Accent)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageW, 44, 'F');
  doc.setFillColor(13, 148, 136); // Teal-600 bottom strip
  doc.rect(0, 42.5, pageW, 1.5, 'F');

  // Avatar or Initial Box (Left)
  const avatarX = marginX;
  const avatarY = 8;
  const avatarSize = 26;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(avatarX - 0.8, avatarY - 0.8, avatarSize + 1.6, avatarSize + 1.6, 3, 3, 'F');

  if (avatarDataUrl) {
    doc.addImage(avatarDataUrl, 'JPEG', avatarX, avatarY, avatarSize, avatarSize);
  } else {
    doc.setFillColor(2, 132, 199);
    doc.roundedRect(avatarX, avatarY, avatarSize, avatarSize, 2.5, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const initial = (profile.name || 'E').charAt(0).toUpperCase();
    doc.text(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 2.2, { align: 'center' });
  }

  // Logo Badge (Top Right)
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageW - marginX - 18, 8, 18, 18, 3, 3, 'F');
    doc.addImage(logoDataUrl, 'PNG', pageW - marginX - 16.5, 9.5, 15, 15);
  }

  // Name & Metadata
  const textStartX = avatarX + avatarSize + 6;
  const maxNameW = pageW - textStartX - marginX - 22;

  doc.setTextColor(56, 189, 248); // Sky-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CURRICULUM VITAE & TRANSKRIP PEMBINAAN ETOS ID', textStartX, 12.5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const splitName = doc.splitTextToSize(profile.name || 'Etoser', maxNameW);
  doc.text(splitName[0], textStartX, 20);

  doc.setTextColor(203, 213, 225); // Slate-300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const subtitleLine = `ID: ${profile.id || '-'}  |  Angkatan ${profile.angkatan || '-'}  |  Wilayah ${
    profile.wilayah || '-'
  }  |  Fase ${profile.fase || 'T0'}`;
  doc.text(subtitleLine, textStartX, 26.5);

  if (profile.universitas) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    const acadLine = `${profile.universitas}${profile.fakultas ? ` - ${profile.fakultas}` : ''}${
      profile.jurusan ? ` (${profile.jurusan})` : ''
    }`;
    const splitAcad = doc.splitTextToSize(acadLine, maxNameW + 18);
    doc.text(splitAcad[0], textStartX, 32);
  }

  let curY = 51;

  const drawSectionHeading = (num, title) => {
    if (curY > pageH - 36) {
      doc.addPage();
      curY = 18;
    }
    doc.setFillColor(240, 249, 255); // Sky-50
    doc.setDrawColor(186, 230, 253); // Sky-200
    doc.roundedRect(marginX, curY, contentW, 8, 1.5, 1.5, 'FD');
    doc.setFillColor(2, 132, 199); // Sky-600 left accent
    doc.rect(marginX, curY, 2.2, 8, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${num}. ${title}`, marginX + 5, curY + 5.3);
    curY += 11;
  };

  // =========================================================================
  // SECTION 1: DATA PROFIL, AKADEMIK & KONTAK
  // =========================================================================
  drawSectionHeading('1', 'PROFIL AKADEMIK & KONTAK');

  autoTable(doc, {
    startY: curY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 36, textColor: [71, 85, 105] },
      1: { cellWidth: contentW / 2 - 36 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 36, textColor: [71, 85, 105] },
      3: { cellWidth: contentW / 2 - 36 },
    },
    body: [
      [
        'Universitas',
        profile.universitas || 'Belum diisi',
        'Semester Berjalan',
        profile.semester_berjalan ? `Semester ${profile.semester_berjalan}` : 'Belum diisi',
      ],
      [
        'Fakultas',
        profile.fakultas || 'Belum diisi',
        'IPK Terakhir',
        profile.ipk_terakhir !== null && profile.ipk_terakhir !== ''
          ? `${Number(profile.ipk_terakhir).toFixed(2)} / 4.00`
          : 'Belum diisi',
      ],
      [
        'Program Studi',
        profile.jurusan || 'Belum diisi',
        'WhatsApp / HP',
        fmtPhone(profile.no_hp),
      ],
      [
        'Alamat Domisili',
        { content: profile.alamat_domisili || 'Belum diisi', colSpan: 3 },
      ],
    ],
  });

  curY = doc.lastAutoTable.finalY + 7;

  // =========================================================================
  // SECTION 2: PORTOFOLIO KARYA, ORGANISASI & PRESTASI
  // =========================================================================
  drawSectionHeading('2', 'PORTOFOLIO KARYA, ORGANISASI & PRESTASI');

  if (portofolios.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, curY, contentW, 10, 1.5, 1.5, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text('Belum ada data portofolio, karya, atau prestasi yang tercatat.', marginX + 4, curY + 6.2);
    curY += 15;
  } else {
    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2.5,
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 52, fontStyle: 'bold' },
        4: { cellWidth: contentW - 104 },
      },
      head: [['No', 'Tahun', 'Kategori', 'Judul Karya / Prestasi / Jabatan', 'Deskripsi & Bukti']],
      body: portofolios.map((item, i) => {
        const descParts = [];
        if (item.deskripsi_singkat) descParts.push(item.deskripsi_singkat);
        if (item.link_bukti) descParts.push(`Bukti: ${item.link_bukti}`);
        return [
          String(i + 1),
          item.tahun || '-',
          item.kategori || '-',
          item.judul_karya || '-',
          descParts.join('\n') || '-',
        ];
      }),
    });
    curY = doc.lastAutoTable.finalY + 7;
  }

  // =========================================================================
  // SECTION 3: REKAP PENGUKURAN RESILIENT LEADERS INDEX (RELI)
  // =========================================================================
  drawSectionHeading('3', 'REKAP PENGUKURAN RESILIENT LEADERS INDEX (RELI)');

  if (!reli.hasData || !reli.history || reli.history.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, curY, contentW, 10, 1.5, 1.5, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text('Belum dilakukan pengukuran Resilient Leaders Index (RELI).', marginX + 4, curY + 6.2);
    curY += 15;
  } else {
    const latestReli = reli.latest;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    const reliSummaryText = `Capaian Terkini (${latestReli.periode}): Skor Akhir ${fmtScore(
      latestReli.finalReli
    )} / 4.00 (${latestReli.maturityLevel || '-'})  |  Awareness: ${latestReli.gapCategory || '-'}${
      latestReli.growthDelta !== null && latestReli.growthDelta !== undefined
        ? `  |  Pertumbuhan vs T0: ${latestReli.growthDelta > 0 ? '+' : ''}${latestReli.growthDelta}`
        : ''
    }`;
    doc.text(reliSummaryText, marginX + 1, curY + 3);
    curY += 5.5;

    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.2,
      },
      styles: {
        font: 'helvetica',
        fontSize: 7.8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 16 },
        8: { halign: 'left', fontStyle: 'bold', cellWidth: 38 },
      },
      head: [
        [
          'Periode',
          'Self',
          'Fasil',
          'Skor RELI',
          'Value Res.',
          'Self Res.',
          'Social Res.',
          'Change Res.',
          'Level Kematangan',
        ],
      ],
      body: reli.history.map((r) => {
        const dims = r.dimensions || {};
        return [
          r.periode || '-',
          fmtScore(r.selfScore),
          r.facilScore !== null && r.facilScore !== undefined ? fmtScore(r.facilScore) : 'Menunggu',
          fmtScore(r.finalReli),
          fmtScore(dims['Value Resilience']?.final),
          fmtScore(dims['Self Resilience']?.final),
          fmtScore(dims['Social Resilience']?.final),
          fmtScore(dims['Change Resilience']?.final),
          r.maturityLevel || '-',
        ];
      }),
    });
    curY = doc.lastAutoTable.finalY + 7;
  }

  // =========================================================================
  // SECTION 4: REKAP MONITORING BULANAN (DATA AWAL S/D SAAT UNDUH)
  // =========================================================================
  drawSectionHeading('4', 'REKAP MONITORING BULANAN INDIVIDU (DATA AWAL S/D SAAT INI)');

  if (!monitoring.hasData || !monitoring.history || monitoring.history.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, curY, contentW, 10, 1.5, 1.5, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text('Belum dilakukan pengukuran evaluasi Monitoring Bulanan.', marginX + 4, curY + 6.2);
    curY += 15;
  } else {
    const varsList = monitoring.variablesList || [];
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    const monevSummaryLine1 = `Periode Terukur: ${monitoring.initial?.periodLabel || '-'} s/d ${
      monitoring.latest?.periodLabel || '-'
    } (${monitoring.totalFilled} Bulan)  |  Rata-rata Kumulatif: ${fmtScore(monitoring.cumulativeAvg)} / 4.00`;
    doc.text(monevSummaryLine1, marginX + 1, curY + 3);
    curY += 4.5;

    if (varsList.length > 0 && monitoring.cumulativeVariables) {
      const varSummaryParts = varsList.map(
        (v) => `${v}: ${fmtScore(monitoring.cumulativeVariables[v])}`
      );
      doc.setFontSize(7.8);
      doc.setTextColor(13, 148, 136);
      doc.text(`Rata-rata Variabel Kumulatif -> ${varSummaryParts.join('  |  ')}`, marginX + 1, curY + 3);
      curY += 5.5;
    } else {
      curY += 1.5;
    }

    const headCols = ['No', 'Periode Bulan', ...varsList, 'Skor Akhir', 'Kategori Capaian'];

    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'grid',
      headStyles: {
        fillColor: [13, 148, 136], // Teal-600
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.2,
      },
      styles: {
        font: 'helvetica',
        fontSize: 7.8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { halign: 'left', fontStyle: 'bold', cellWidth: 32 },
        [headCols.length - 2]: { fontStyle: 'bold' },
        [headCols.length - 1]: { halign: 'left', cellWidth: 36 },
      },
      head: [headCols],
      body: monitoring.history.map((row, idx) => [
        String(idx + 1),
        row.periodLabel,
        ...varsList.map((v) => fmtScore(row.variables?.[v])),
        fmtScore(row.score),
        row.maturityLevel || '-',
      ]),
    });
  }

  // =========================================================================
  // FOOTER ON EVERY PAGE
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  const downloadedDateStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen resmi Portal Pembinaan Etos ID • Diunduh pada ${downloadedDateStr} WIB`,
      marginX,
      pageH - 7.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW - marginX, pageH - 7.5, { align: 'right' });
  }

  const safeName = (profile.name || 'Etoser')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const fileName = `CV_EtosID_${profile.id || 'Awardee'}_${safeName}.pdf`;
  doc.save(fileName);
}
