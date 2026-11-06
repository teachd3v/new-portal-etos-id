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

function fmtPhone(noHp) {
  if (!noHp) return 'Belum diisi';
  const clean = String(noHp).trim();
  if (clean.startsWith('+62') || clean.startsWith('0')) return clean;
  return `+62 ${clean}`;
}

export async function exportFasilCvPdf(payload) {
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

  const profile = payload?.profile || {};
  const portofolios = payload?.portofolios || [];
  const binaan = payload?.binaan || [];
  const evaluasi = payload?.evaluasi || [];

  const [logoDataUrl, avatarDataUrl] = await Promise.all([
    loadImageAsDataUrl('/icons/icon-192x192.png', 200, true),
    profile.foto_profil ? loadAvatarSquareDataUrl(profile.foto_profil, 220) : Promise.resolve(null),
  ]);

  // =========================================================================
  // 1. HEADER BANNER (Dark Burnt Orange + Amber Accent)
  // =========================================================================
  doc.setFillColor(67, 20, 7); // #431407 Dark Orange / Burnt
  doc.rect(0, 0, pageW, 46, 'F');
  doc.setFillColor(234, 88, 12); // Orange-600 strip
  doc.rect(0, 44.5, pageW, 1.5, 'F');

  // Avatar or Initial Box (Left)
  const avatarX = marginX;
  const avatarY = 8;
  const avatarSize = 28;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(avatarX - 0.8, avatarY - 0.8, avatarSize + 1.6, avatarSize + 1.6, 3, 3, 'F');

  if (avatarDataUrl) {
    doc.addImage(avatarDataUrl, 'JPEG', avatarX, avatarY, avatarSize, avatarSize);
  } else {
    doc.setFillColor(154, 52, 18); // Orange-800
    doc.roundedRect(avatarX, avatarY, avatarSize, avatarSize, 2.5, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const initial = (profile.name || 'F').charAt(0).toUpperCase();
    doc.text(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 2.5, { align: 'center' });
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

  doc.setTextColor(254, 215, 170); // Orange-200
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PROFIL PROFESIONAL FASILITATOR & MITRA PROGRAM ETOS ID', textStartX, 12.5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const splitName = doc.splitTextToSize(profile.name || 'Fasilitator', maxNameW);
  doc.text(splitName[0], textStartX, 20);

  doc.setTextColor(254, 243, 199); // Amber-100
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const titleLine = [profile.profesi, profile.instansi].filter(Boolean).join(' • ') || 'Mitra Fasilitator Program';
  const splitTitle = doc.splitTextToSize(titleLine, maxNameW + 10);
  doc.text(splitTitle[0], textStartX, 26.5);

  doc.setTextColor(253, 186, 116); // Orange-300
  doc.setFontSize(8);
  const metaLine = `ID: ${profile.id || '-'}  |  Role: ${profile.fasil_role || 'Fasilitator'}  |  Wilayah ${profile.wilayah || '-'}`;
  doc.text(metaLine, textStartX, 33);

  let curY = 53;

  const drawSectionHeading = (num, title) => {
    if (curY > pageH - 36) {
      doc.addPage();
      curY = 18;
    }
    doc.setFillColor(255, 247, 237); // Orange-50
    doc.setDrawColor(254, 215, 170); // Orange-200
    doc.roundedRect(marginX, curY, contentW, 8, 1.5, 1.5, 'FD');
    doc.setFillColor(234, 88, 12); // Orange-600 left accent
    doc.rect(marginX, curY, 2.2, 8, 'F');

    doc.setTextColor(67, 20, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${num}. ${title}`, marginX + 5, curY + 5.3);
    curY += 11;
  };

  // =========================================================================
  // SECTION 1: PROFIL KARIER & KEAHLIAN PROFESIONAL
  // =========================================================================
  drawSectionHeading('1', 'KARIER & KEAHLIAN PROFESIONAL');

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
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40, textColor: [71, 85, 105] },
      1: { cellWidth: contentW / 2 - 40 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40, textColor: [71, 85, 105] },
      3: { cellWidth: contentW / 2 - 40 },
    },
    body: [
      [
        'Posisi / Profesi Saat Ini',
        profile.profesi || 'Belum diisi',
        'Sektor Industri',
        profile.sektor_industri || 'Belum diisi',
      ],
      [
        'Instansi / Perusahaan',
        profile.instansi || 'Belum diisi',
        'Pengalaman Kerja',
        profile.pengalaman_tahun || 'Belum diisi',
      ],
      [
        'Bidang Keahlian / Mentoring',
        { content: profile.bidang_keahlian || 'Belum diisi', colSpan: 3 },
      ],
      [
        'Ringkasan Profil (Bio)',
        { content: profile.bio_profesional || 'Belum ada ringkasan profesional.', colSpan: 3 },
      ],
    ],
  });

  curY = doc.lastAutoTable.finalY + 7;

  // =========================================================================
  // SECTION 2: PENDIDIKAN & KONTAK RESMI
  // =========================================================================
  drawSectionHeading('2', 'PENDIDIKAN TERAKHIR & KONTAK');

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
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40, textColor: [71, 85, 105] },
      1: { cellWidth: contentW / 2 - 40 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40, textColor: [71, 85, 105] },
      3: { cellWidth: contentW / 2 - 40 },
    },
    body: [
      [
        'Jenjang Pendidikan',
        profile.pendidikan_terakhir || 'Belum diisi',
        'WhatsApp / HP Aktif',
        fmtPhone(profile.no_hp),
      ],
      [
        'Perguruan Tinggi / Almamater',
        profile.universitas || 'Belum diisi',
        'Email Profesional',
        profile.email_profesional || 'Belum diisi',
      ],
      [
        'Bidang Studi / Jurusan',
        profile.jurusan || 'Belum diisi',
        'Tautan LinkedIn',
        profile.linkedin_url || 'Belum diisi',
      ],
      [
        'Alamat Domisili',
        { content: profile.alamat_domisili || 'Belum diisi', colSpan: 3 },
      ],
    ],
  });

  curY = doc.lastAutoTable.finalY + 7;

  // =========================================================================
  // SECTION 3: PORTOFOLIO KARYA, PENGALAMAN & PRESTASI PROFESIONAL
  // =========================================================================
  drawSectionHeading('3', 'PORTOFOLIO, SERTIFIKASI & PENGALAMAN PROFESIONAL');

  if (portofolios.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, curY, contentW, 10, 1.5, 1.5, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text('Belum ada data sertifikasi, pengalaman fasilitasi, atau portofolio profesional.', marginX + 4, curY + 6.2);
    curY += 15;
  } else {
    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'striped',
      headStyles: {
        fillColor: [67, 20, 7],
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
        2: { cellWidth: 32 },
        3: { cellWidth: 50, fontStyle: 'bold' },
        4: { cellWidth: contentW - 108 },
      },
      head: [['No', 'Tahun', 'Kategori', 'Judul / Posisi / Sertifikasi', 'Deskripsi & Tautan Bukti']],
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
  // SECTION 4: ETOSER BINAAN DALAM PENDAMPINGAN
  // =========================================================================
  if (binaan && binaan.length > 0) {
    drawSectionHeading('4', `ETOSER BINAAN DALAM PENDAMPINGAN (WILAYAH ${profile.wilayah || '-'})`);

    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.2,
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold', halign: 'center' },
        2: { cellWidth: 60, fontStyle: 'bold' },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: contentW - 122 },
      },
      head: [['No', 'ID Etoser', 'Nama Etoser', 'Angkatan', 'Kampus / Perguruan Tinggi']],
      body: binaan.map((b, idx) => [
        String(idx + 1),
        b.id,
        b.name,
        b.angkatan || '-',
        b.universitas || '-',
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
      `Dokumen profil mitra program Portal Etos ID • Diunduh pada ${downloadedDateStr} WIB`,
      marginX,
      pageH - 7.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW - marginX, pageH - 7.5, { align: 'right' });
  }

  const safeName = (profile.name || 'Fasilitator')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const fileName = `CV_Mitra_Fasil_${profile.id || 'Fasil'}_${safeName}.pdf`;
  doc.save(fileName);
}
