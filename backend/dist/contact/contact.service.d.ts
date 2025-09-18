export declare class ContactService {
    private readonly logger;
    private transporter;
    sendMail(params: {
        name: string;
        email: string;
        message: string;
        ip?: string;
        requestId?: string;
    }): Promise<{
        messageId: any;
    }>;
}
