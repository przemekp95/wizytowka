"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ContactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = __importDefault(require("nodemailer"));
function toBool(v) {
    const s = String(v ?? '').toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'ssl';
}
let ContactService = ContactService_1 = class ContactService {
    logger = new common_1.Logger(ContactService_1.name);
    transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: toBool(process.env.SMTP_SECURE ?? true),
        auth: process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000,
    }, {
        logger: toBool(process.env.SMTP_DEBUG ?? false),
        debug: toBool(process.env.SMTP_DEBUG ?? false),
    });
    async sendMail(params) {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
        const to = process.env.SMTP_TO || process.env.SMTP_USER || '';
        if (!process.env.SMTP_HOST || !from || !to) {
            throw new Error('Brak konfiguracji SMTP (HOST/FROM/TO)');
        }
        const lines = [
            `Imię i nazwisko: ${params.name}`,
            `E-mail: ${params.email}`,
            params.ip ? `IP: ${params.ip}` : undefined,
            params.requestId ? `Request-Id: ${params.requestId}` : undefined,
            '---',
            params.message,
        ].filter(Boolean);
        const plain = lines.join('\n');
        const info = await this.transporter.sendMail({
            from,
            to,
            replyTo: params.email,
            subject: `Wiadomość ze strony – ${params.name}`,
            text: plain,
            headers: { 'X-Request-Id': params.requestId ?? '' },
        });
        this.logger.log(`Mail sent: messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} req=${params.requestId}`);
        return { messageId: info.messageId };
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = ContactService_1 = __decorate([
    (0, common_1.Injectable)()
], ContactService);
//# sourceMappingURL=contact.service.js.map