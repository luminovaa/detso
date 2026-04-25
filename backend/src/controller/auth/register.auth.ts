import { Request, Response } from 'express'
import { Detso_Role } from '@prisma/client' // Pastikan sudah generate prisma client baru
import bcrypt from 'bcryptjs'
import { createUserSchema, registerSchema } from './validation/validation.auth' // Update schema validasimu nanti
import { asyncHandler, AuthenticationError, AuthorizationError, ValidationError } from '../../utils/error-handler'
import { responseData } from '../../utils/response-handler'
import { prisma } from '../../utils/prisma'
import { deleteFile, getUploadedFileInfo } from '../../config/upload-file'

const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

export const registerTenant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 0. Handle File Upload (Logo)
    const cleanupUploadedFile = async () => {
        if (req.file) {
            await deleteFile(req.file.path).catch(console.error);
        }
    };

    let uploadedLogo: { path: string; fileName: string } | undefined;
    if (req.file) {
        uploadedLogo = getUploadedFileInfo(req.file, 'storage/public/tenants/logo');
    }

    // Pastikan schema validasi menerima field: company_name
    const validationResult = registerSchema.safeParse(req.body)

    if (!validationResult.success) {
        await cleanupUploadedFile();
        throw new ValidationError('Validasi Gagal', validationResult.error.issues);
    }

    const { email, password, username, phone, full_name, company_name, address, lat, long } = validationResult.data

    // 1. Cek User Duplikat (Global Check)
    const existingUser = await prisma.detso_User.findFirst({
        where: {
            deleted_at: null,
            OR: [{ email }, { username }]
        }
    })

    if (existingUser) {
        await cleanupUploadedFile();
        throw new AuthenticationError('Email atau Username sudah digunakan')
    }

    // 2. Cek Nama Perusahaan (Tenant) Duplikat
    // Generate slug dari company name, misal "Berkah Net" -> "berkah-net"
    const slug = createSlug(company_name!);

    const existingTenant = await prisma.detso_Tenant.findUnique({
        where: { slug }
    });

    if (existingTenant) {
        await cleanupUploadedFile();
        throw new AuthenticationError('Nama ISP/Perusahaan ini sudah terdaftar.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        // 3. Transaction: Buat Tenant DULU, baru buat User yang di-link ke Tenant itu
        const result = await prisma.$transaction(async (tx) => {
            // A. Buat Tenant
            const newTenant = await tx.detso_Tenant.create({
                data: {
                    name: company_name!,
                    slug: slug,
                    address: address,
                    phone: phone, 
                    lat: lat,
                    long: long,
                    logo: uploadedLogo?.path
                }
            });

            // B. Buat User (Owner)
            const newUser = await tx.detso_User.create({
                data: {
                    tenant_id: newTenant.id, // Link ke tenant baru
                    email,
                    password: hashedPassword,
                    username,
                    phone,
                    role: Detso_Role.TENANT_OWNER // Otomatis jadi Owner
                }
            });

            // C. Buat Profile
            const profile = await tx.detso_Profile.create({
                data: {
                    full_name: full_name || 'Owner',
                    user_id: newUser.id
                }
            });

            return {
                tenant: newTenant,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role,
                    tenant_id: newUser.tenant_id
                },
                profile
            };
        });

        responseData(res, 201, 'Pendaftaran ISP Berhasil', result);
    } catch (error) {
        await cleanupUploadedFile();
        throw error;
    }
})

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.user;

    // 1. Security Check Basic
    if (!currentUser || !currentUser.tenant_id) {
        throw new AuthenticationError('Sesi tidak valid. Tenant ID tidak ditemukan.');
    }

    // 2. Role Check: Siapa yang boleh akses endpoint ini?
    if (currentUser.role !== Detso_Role.TENANT_OWNER && currentUser.role !== Detso_Role.TENANT_ADMIN) {
        throw new AuthorizationError('Anda tidak memiliki izin untuk menambah pengguna.');
    }

    // 3. Validasi Input
    const validationResult = createUserSchema.safeParse(req.body);
    if (!validationResult.success) {
        throw new ValidationError('Validasi Gagal', validationResult.error.issues);
    }

    const { email, username, password, full_name, phone, role } = validationResult.data;

    // --- [NEW] SECURITY CHECK: ROLE HIERARCHY ---
    const targetRole = (role ?? Detso_Role.TENANT_TEKNISI) as Detso_Role;

    // A. Cegah pembuatan SAAS_SUPER_ADMIN (Fatal jika lolos)
    if (targetRole === Detso_Role.SAAS_SUPER_ADMIN) {
        throw new AuthorizationError('Tidak dapat membuat Super Admin melalui jalur ini.');
    }

    // B. Cegah Admin membuat Owner (Kudeta Protection)
    // Hanya Owner yang boleh membuat Owner lain (jika diizinkan)
    if (currentUser.role === Detso_Role.TENANT_ADMIN && targetRole === Detso_Role.TENANT_OWNER) {
        throw new AuthorizationError('Admin tidak memiliki wewenang untuk membuat akun Owner.');
    }
    // -------------------------------------------

    // 4. Cek Duplikasi
    const existingUser = await prisma.detso_User.findFirst({
        where: {
            deleted_at: null,
            OR: [{ email }, { username }]
        }
    });

    if (existingUser) {
        throw new AuthenticationError('Email atau Username sudah digunakan.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create User (Inject Tenant ID)
    const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.detso_User.create({
            data: {
                tenant_id: currentUser.tenant_id, // Aman: Mengikut user yang login
                email,
                username,
                password: hashedPassword,
                phone,
                role: targetRole 
            }
        });

        const profile = await tx.detso_Profile.create({
            data: {
                full_name: full_name,
                user_id: newUser.id
            }
        });

        return {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            profile
        };
    });

    responseData(res, 201, 'Pengguna baru berhasil ditambahkan', result);
});