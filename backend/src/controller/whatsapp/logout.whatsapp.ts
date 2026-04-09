import { Request, Response } from "express";
// import { WhatsAppService, whatsappService } from "../../services/whatsapp.service";
import { asyncHandler, AuthenticationError } from "../../utils/error-handler";
import { responseData } from "../../utils/response-handler";
import { whatsappManager } from "../../services/whatsapp-manager";

export const logoutWhatsapp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user || !user.tenant_id) throw new AuthenticationError('Sesi tidak valid');

    // [UBAH] Panggil logout spesifik tenant
    await whatsappManager.logout(user.tenant_id);
    
    responseData(res, 200, 'WhatsApp berhasil diputuskan');
});