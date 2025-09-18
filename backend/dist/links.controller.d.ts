import type { Response } from 'express';
type Link = {
    slug: string;
    title: string;
    url: string;
};
export declare class LinksController {
    all(): Link[];
    redirect(slug: string, res: Response): void;
}
export {};
