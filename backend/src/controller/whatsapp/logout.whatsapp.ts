import { Request, Response } from "express";
import { WhatsAppService, whatsappService } from "../../services/whatsapp.service";
import { asyncHandler } from "../../utils/error-handler";
import { responseData } from "../../utils/response-handler";

export const logoutWhatsapp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await whatsappService.destroy();
    WhatsAppService.clearInstance();
    responseData(res, 200, 'WhatsApp Disconnected');
});