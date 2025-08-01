// services/pdf-generator.service.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface CustomerData {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    nik: string | null;
}

interface ServiceConnectionData {
    id: string;
    id_pel: string | null;
    package_name: string;
    package_speed: string;
    address: string | null;
    ip_address: string | null;
    mac_address: string | null;
    notes: string | null;
}

interface DocumentData {
    document_type: string;
    document_url: string;
}

interface PhotoData {
    photo_type: string;
    photo_url: string;
}

interface PDFGenerationData {
    customer: CustomerData;
    serviceConnection: ServiceConnectionData;
    documents: DocumentData[];
    photos: PhotoData[];
}

export class PDFGeneratorService {
    private readonly WATERMARK_TEXT = 'DETSO NETWORK';
    private readonly PDF_DIR = 'storage/pdfs/installation-reports';
    private readonly LOGO_LEFT_PATH = 'assets/logo.png'; // Path logo kiri
    private readonly LOGO_RIGHT_PATH = 'assets/logo.png'; // Path logo kanan

    constructor() {
        // Pastikan direktori PDF ada
        if (!fs.existsSync(this.PDF_DIR)) {
            fs.mkdirSync(this.PDF_DIR, { recursive: true });
        }
    }

    async generateInstallationReport(data: PDFGenerationData): Promise<string> {
        const fileName = `installation-report-${data.serviceConnection.id_pel}-${Date.now()}.pdf`;
        const filePath = path.join(this.PDF_DIR, fileName);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 80, bottom: 50, left: 50, right: 50 }
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                this.addWatermark(doc);
                this.addHeader(doc);
                this.addMainContent(doc, data);

                if (data.documents.length > 0) {
                    this.addDocumentsPage(doc, data.documents);
                }

                if (data.photos.length > 0) {
                    this.addPhotosPages(doc, data.photos);
                }

                doc.end();

                stream.on('finish', () => {
                    resolve(filePath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    private addWatermark(doc: PDFKit.PDFDocument) {
        doc.save();

        doc.fillOpacity(0.5)
            .fontSize(50)
            .rotate(-45, { origin: [300, 400] })
            .fillColor('#cccccc')
            .text(this.WATERMARK_TEXT, 150, 350, {
                align: 'center',
                width: 400
            });

        doc.restore();
    }

    private addHeader(doc: PDFKit.PDFDocument) {
    const logoY = 20;
    const logoWidth = 75;
    const logoHeight = 60;
    const textY1 = 25;
    const textY2 = 40;
    const textY3 = 55;
    const addressY = 70;
    const lineY = 90;

    // Left logo
    try {
        if (fs.existsSync(this.LOGO_LEFT_PATH)) {
            doc.image(this.LOGO_LEFT_PATH, 50, logoY, { 
                width: logoWidth, 
                height: logoHeight,
            });
        }
    } catch (error) {
        doc.rect(50, logoY, logoWidth, logoHeight)
            .strokeColor('#000000')
            .stroke();
    }

    // Company information (centered, more formal)
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#000000')
       .text('PT. MULTI GUNA SINERGI', 0, textY1, {
           align: 'center',
           width: 612
       });

    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#000000')
       .text('Dewa Telekomunikasi Solusindo', 0, textY2, {
           align: 'center',
           width: 612
       });

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#000000')
       .text('Penyedia Layanan Jaringan Internet', 0, textY3, {
           align: 'center',
           width: 612
       });

    // Company address (more compact)
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#000000')
       .text('Kantor Pusat: Dsn. Luwung Ds. Sidomojo RT 001/RW 003 Kec. Krian Kab. Sidoarjo', 0, addressY, {
           align: 'center',
           width: 612
       })
       .text('HP/WA: 0851-0013-4712 | Email: info@detso.net', 0, addressY + 12, {
           align: 'center',
           width: 612
       })

    // Right logo
    try {
        if (fs.existsSync(this.LOGO_RIGHT_PATH)) {
            doc.image(this.LOGO_RIGHT_PATH, 502, logoY, { 
                width: logoWidth, 
                height: logoHeight,
                align: 'right',
            });
        }
    } catch (error) {
        doc.rect(502, logoY, logoWidth, logoHeight)
            .strokeColor('#000000')
            .stroke();
    }

    doc.moveDown(1)

    // Horizontal line (full width, thicker)
    doc.moveTo(50, lineY)
       .lineTo(562, lineY)
       .strokeColor('#000000')
       .lineWidth(1.5)
       .stroke();

    // Small decorative lines
    doc.moveTo(50, lineY + 3)
       .lineTo(100, lineY + 3)
       .strokeColor('#000000')
       .lineWidth(0.5)
       .stroke();

    doc.moveTo(512, lineY + 3)
       .lineTo(562, lineY + 3)
       .strokeColor('#000000')
       .lineWidth(0.5)
       .stroke();
}

    private addMainContent(doc: PDFKit.PDFDocument, data: PDFGenerationData) {
        const { customer, serviceConnection } = data;

        // Title dan tanggal (warna hitam)
        doc.fontSize(18)
            .fillColor('#000000')
            .text('Formulir Pendaftaran Data Pelanggan', 50, 110, { align: 'center' });

        // Tabel informasi pelanggan seperti di foto
        let currentY = 140;
        const tableX = 50;
        const tableWidth = 512;
        const rowHeight = 18;

        // Data untuk tabel
        const tableData = [
            ['Nama', customer.name],
            ['NIK', customer.nik || '-'],
            ['Tempat', '-'], // Bisa ditambahkan field baru jika diperlukan
            ['Tanggal Lahir', '-'], // Bisa ditambahkan field baru jika diperlukan
            ['Alamat', serviceConnection.address || '-'],
            ['No.WA Aktif', customer.phone || '-'],
            ['Email', customer.email || '-'],
            ['Titik Koordinat', '-'] // Bisa ditambahkan field baru jika diperlukan
        ];

        // Gambar tabel dengan border
        doc.rect(tableX, currentY, tableWidth, tableData.length * rowHeight)
            .strokeColor('#000000')
            .lineWidth(1)
            .stroke();

        // Gambar setiap baris
        tableData.forEach((row, index) => {
            const rowY = currentY + (index * rowHeight);
            
            // Border horizontal
            if (index > 0) {
                doc.moveTo(tableX, rowY)
                    .lineTo(tableX + tableWidth, rowY)
                    .strokeColor('#000000')
                    .lineWidth(1)
                    .stroke();
            }
            
            // Border vertikal (pemisah kolom)
            doc.moveTo(tableX + 120, rowY)
                .lineTo(tableX + 120, rowY + rowHeight)
                .strokeColor('#000000')
                .lineWidth(1)
                .stroke();

            // Isi teks
            doc.fontSize(10)
                .fillColor('#000000')
                .text(row[0], tableX + 10, rowY + 8, { width: 100 })
                .text(row[1], tableX + 130, rowY + 8, { width: 370 });
        });

        // Syarat/Lampiran dan Ketentuan
        currentY = currentY + (tableData.length * rowHeight) + 30;

        // Syarat/Lampiran
        doc.fontSize(12)
            .fillColor('#000000')
            .text('Syarat/Lampiran', 50, currentY);

        currentY += 20;
        const syaratLampiran = [
            '1. Mengisi Formulir Pendaftaran DETSO NETWORK',
            '2. Foto KTP',
            '3. Rumah Tampak Depan',
            '4. Titik Koordinat',
            '5. Rumah Tampak Jauh sisi Kanan',
            '6. Rumah Tampak Jauh sisi Kiri'
        ];

        syaratLampiran.forEach(item => {
            doc.fontSize(10)
                .fillColor('#000000')
                .text(item, 50, currentY);
            currentY += 15;
        });

        currentY += 10;

        // Ketentuan
        doc.fontSize(12)
            .fillColor('#000000')
            .text('Ketentuan', 50, currentY, { width: 500 });

        currentY += 20;
        const ketentuan = [
            '1. Pasang Baru dikenakan biaya Rp.100.000',
            '2. Fasilitas Jaringan internet akan ditanggung oleh pihak penyedia layanan jaringan internet',
            '   (Dipinjami dan Bukan untuk di perjual belikan)',
            '3. Internet aktif di hari pemasangan',
            '4. Tagihan Internet akan di tangguhkan pada bulan berikutnya setelah pemasangan',
            '5. Membayar tagihan internet sebesar paket yang di ambil tertanggal 1 – 10 pada awal bulan',
            '6. Data pelanggan akan di simpan dan di rekam untuk arsip penyedia layanan jaringan internet',
            '7. Bila ada gangguan diharap segera lapor ke CS Admin Penyedia layanan jaringan'
        ];

        ketentuan.forEach(item => {
            doc.fontSize(10)
                .fillColor('#000000')
                .text(item, 50, currentY, { width: 500 });
            if (item.includes('(Dipinjami')) {
                currentY += 15;
            } else {
                currentY += 20;
            }
        });
    }

    private addDocumentsPage(doc: PDFKit.PDFDocument, documents: DocumentData[]) {
        doc.addPage();
        this.addWatermark(doc);
        this.addHeader(doc);

        doc.fontSize(16)
            .fillColor('#000000')
            .text('DOKUMEN PELANGGAN', 50, 110);

        let yPosition = 150;

        documents.forEach((document, index) => {
            // Container dokumen
            doc.rect(50, yPosition - 10, 512, 250)
                .strokeColor('#000000')
                .stroke();

            // Header dokumen
            doc.rect(50, yPosition - 10, 512, 30)
                .fillColor('#f3f4f6')
                .fill();

            doc.fontSize(12)
                .fillColor('#000000')
                .text(`${index + 1}. ${document.document_type}`, 60, yPosition);

            yPosition += 30;

            // Gambar dokumen
            try {
                const imagePath = path.resolve(document.document_url);
                if (fs.existsSync(imagePath)) {
                    doc.image(imagePath, 60, yPosition, {
                        fit: [490, 200],
                        align: 'center'
                    });
                } else {
                    doc.rect(60, yPosition, 490, 200)
                        .fillColor('#f9fafb')
                        .fill()
                        .strokeColor('#000000')
                        .stroke();

                    doc.fontSize(12)
                        .fillColor('#000000')
                        .text('Dokumen tidak ditemukan', 0, yPosition + 95, {
                            align: 'center',
                            width: 612
                        });
                }
            } catch (error) {
                doc.rect(60, yPosition, 490, 200)
                    .fillColor('#fef2f2')
                    .fill()
                    .strokeColor('#000000')
                    .stroke();

                doc.fontSize(12)
                    .fillColor('#000000')
                    .text('Error memuat dokumen', 0, yPosition + 95, {
                        align: 'center',
                        width: 612
                    });
            }

            yPosition += 270;

            // Tambah halaman baru jika perlu
            if (yPosition > 600 && index < documents.length - 1) {
                doc.addPage();
                this.addWatermark(doc);
                this.addHeader(doc);
                yPosition = 150;
            }
        });
    }

    private addPhotosPages(doc: PDFKit.PDFDocument, photos: PhotoData[]) {
        doc.addPage();
        this.addWatermark(doc);
        this.addHeader(doc);

        doc.fontSize(16)
            .fillColor('#000000')
            .text('DOKUMENTASI PEMASANGAN', 50, 110);

        let yPosition = 150;

        photos.forEach((photo, index) => {
            // Container foto
            doc.rect(50, yPosition - 10, 512, 320)
                .strokeColor('#000000')
                .stroke();

            // Header foto
            doc.rect(50, yPosition - 10, 512, 30)
                .fillColor('#f3f4f6')
                .fill();

            doc.fontSize(12)
                .fillColor('#000000')
                .text(`${index + 1}. ${photo.photo_type}`, 60, yPosition);

            yPosition += 30;

            // Foto
            try {
                const imagePath = path.resolve(photo.photo_url);
                if (fs.existsSync(imagePath)) {
                    doc.image(imagePath, 60, yPosition, {
                        fit: [490, 270],
                        align: 'center'
                    });
                } else {
                    doc.rect(60, yPosition, 490, 270)
                        .fillColor('#f9fafb')
                        .fill()
                        .strokeColor('#000000')
                        .stroke();

                    doc.fontSize(12)
                        .fillColor('#000000')
                        .text('Foto tidak ditemukan', 0, yPosition + 130, {
                            align: 'center',
                            width: 612
                        });
                }
            } catch (error) {
                doc.rect(60, yPosition, 490, 270)
                    .fillColor('#fef2f2')
                    .fill()
                    .strokeColor('#000000')
                    .stroke();

                doc.fontSize(12)
                    .fillColor('#000000')
                    .text('Error memuat foto', 0, yPosition + 130, {
                        align: 'center',
                        width: 612
                    });
            }

            yPosition += 340;

            // Tambah halaman baru jika perlu
            if (yPosition > 500 && index < photos.length - 1) {
                doc.addPage();
                this.addWatermark(doc);
                this.addHeader(doc);
                yPosition = 150;
            }
        });
    }
}