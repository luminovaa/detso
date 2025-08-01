// controllers/pdf.controller.ts
import { Request, Response } from 'express';
import { asyncHandler, NotFoundError } from '../../utils/error-handler';
import { prisma } from '../../utils/prisma';
import fs from 'fs';
import path from 'path';

export const downloadInstallationReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { customerId } = req.params;

    const customerPdf = await prisma.detso_Customer_PDF.findFirst({
        where: {
            customer_id: customerId,
            pdf_type: 'installation_report'
        },
        orderBy: {
            generated_at: 'desc'
        },
        include: {
            customer: true,
            service_connection: true
        }
    });

    if (!customerPdf) {
        throw new NotFoundError('PDF laporan pemasangan tidak ditemukan');
    }

    const filePath = path.resolve(customerPdf.pdf_path);

    if (!fs.existsSync(filePath)) {
        throw new NotFoundError('File PDF tidak ditemukan di sistem');
    }

    const fileName = `Laporan-Pemasangan-${customerPdf.service_connection.id_pel || 'unknown'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

export const viewInstallationReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { customerId } = req.params;

    const customerPdf = await prisma.detso_Customer_PDF.findFirst({
        where: {
            customer_id: customerId,
            pdf_type: 'installation_report'
        },
        orderBy: {
            generated_at: 'desc'
        }
    });

    if (!customerPdf) {
        throw new NotFoundError('PDF laporan pemasangan tidak ditemukan');
    }

    const filePath = path.resolve(customerPdf.pdf_path);

    if (!fs.existsSync(filePath)) {
        throw new NotFoundError('File PDF tidak ditemukan di sistem');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});