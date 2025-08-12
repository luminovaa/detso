import { User } from "./user.types";

export type RefreshToken = {
    id?: string;
    user_id: string;
    token: string;
    device_info: string;
    ip_address: string;
    user_agent: string;
    expires_at: Date;
    revoked_at?: Date;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    user: User;
}