'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

type GoogleAnalyticsProps = {
  measurementId: string;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sendPageView(measurementId: string, path: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'page_view', {
    send_to: measurementId,
    page_title: document.title,
    page_location: window.location.href,
    page_path: path,
  });
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialRender = useRef(true);
  const searchParamsString = searchParams.toString();
  const currentPath = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
  const serializedMeasurementId = JSON.stringify(measurementId);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    sendPageView(measurementId, currentPath);
  }, [currentPath, measurementId]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', ${serializedMeasurementId}, { send_page_view: false });
          gtag('event', 'page_view', {
            send_to: ${serializedMeasurementId},
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname + window.location.search,
          });
        `}
      </Script>
    </>
  );
}
