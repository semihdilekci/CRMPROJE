'use client';

import { Button } from '@/components/ui/Button';
import { useHasOfferDocument, useDownloadOfferDocument } from '@/hooks/use-offer';

export function OfferDownloadButton({ opportunityId }: { opportunityId: string }) {
  const { data: hasOffer } = useHasOfferDocument(opportunityId);
  const download = useDownloadOfferDocument(opportunityId);
  if (!hasOffer) return null;
  return (
    <div className="mt-2">
      <Button
        variant="secondary"
        onClick={() => download.mutate()}
        disabled={download.isPending}
        className="text-[13px]"
      >
        {download.isPending ? 'İndiriliyor...' : '📄 Teklif Dokümanı İndir'}
      </Button>
    </div>
  );
}
