'use client';

import { useTranslations } from 'next-intl';

export default function TestPage() {
  const t = useTranslations('hero');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test tłumaczeń</h1>
      <p className="mb-2">Tytuł: {t('title')}</p>
      <p className="mb-2">Opis: {t('description')}</p>
      <p className="mb-2">Zobacz projekty: {t('viewProjects')}</p>
      <p className="mb-2">Kontakt: {t('contactMe')}</p>
    </div>
  );
}
