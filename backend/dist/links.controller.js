"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinksController = void 0;
const common_1 = require("@nestjs/common");
const LINKS = [
    { slug: 'github', title: 'GitHub', url: 'https://github.com/TwojNick' },
    { slug: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/in/TwojProfil' },
];
let LinksController = class LinksController {
    all() {
        return LINKS;
    }
    redirect(slug, res) {
        const found = LINKS.find(l => l.slug === slug);
        if (!found)
            return res.redirect(302, '/');
        return res.redirect(302, found.url);
    }
};
exports.LinksController = LinksController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LinksController.prototype, "all", null);
__decorate([
    (0, common_1.Get)('r/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LinksController.prototype, "redirect", null);
exports.LinksController = LinksController = __decorate([
    (0, common_1.Controller)('links')
], LinksController);
//# sourceMappingURL=links.controller.js.map