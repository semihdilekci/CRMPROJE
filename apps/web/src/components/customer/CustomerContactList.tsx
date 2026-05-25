'use client';

import { useState } from 'react';
import type { CustomerContact } from '@crm/shared';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerContactEditModal } from '@/components/customer/CustomerContactEditModal';
import { useDeleteCustomerContact } from '@/hooks/use-customer-contacts';

interface CustomerContactListProps {
  customerId: string;
  companyName: string;
  contacts: CustomerContact[];
  canEdit?: boolean;
  canDelete?: boolean;
}

export function CustomerContactList({
  customerId,
  companyName,
  contacts,
  canEdit = true,
  canDelete = true,
}: CustomerContactListProps) {
  const deleteContact = useDeleteCustomerContact(customerId);

  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<CustomerContact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [deleteContactName, setDeleteContactName] = useState('');

  const handleEdit = (contact: CustomerContact) => {
    setEditInitial(contact);
    setEditOpen(true);
  };

  const handleAddNew = () => {
    setEditInitial(null);
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteContactId) return;
    await deleteContact.mutateAsync(deleteContactId);
    setDeleteContactId(null);
  };

  return (
    <>
      <section className="fade-up mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#f0ede8]/50">
            Temsilciler ({contacts.length})
          </p>
          {canEdit && (
            <Button
              type="button"
              className="px-3 py-1.5 text-[12px]"
              onClick={handleAddNew}
            >
              + Temsilci Ekle
            </Button>
          )}
        </div>

        {contacts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[14px] text-[#f0ede8]/50">Henüz temsilci eklenmemiş.</p>
            <p className="mt-1 text-[13px] text-[#f0ede8]/30">
              Fuarda kartvizit alıp tarayarak hızlıca ekleyebilirsiniz.
            </p>
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                className="mt-4 text-[13px]"
                onClick={handleAddNew}
              >
                + İlk Temsilciyi Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
              >
                <div className="flex gap-4">
                  {contact.cardImage && (
                    <img
                      src={contact.cardImage}
                      alt="Kartvizit"
                      className="h-14 w-14 rounded-lg border border-white/20 object-cover shrink-0"
                    />
                  )}
                  <div>
                    <p className="text-[15px] font-semibold text-[#f0ede8]">{contact.name}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-[13px] text-[#f0ede8]/60">
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="hover:text-[#f0ede8]">
                          📞 {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="hover:text-[#f0ede8]">
                          ✉ {contact.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {(canEdit || canDelete) && (
                  <div className="flex gap-1.5">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleEdit(contact)}
                        className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.04] text-[12px] text-[#f0ede8]/65 transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteContactId(contact.id);
                          setDeleteContactName(contact.name);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.04] text-[12px] text-[#f0ede8]/65 transition-colors hover:border-red-400/25 hover:bg-red-400/12 hover:text-red-400"
                        title="Sil"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <CustomerContactEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customerId={customerId}
        companyName={companyName}
        initial={editInitial}
      />

      <ConfirmDialog
        open={!!deleteContactId}
        onClose={() => setDeleteContactId(null)}
        onConfirm={handleDeleteConfirm}
        title="Temsilciyi Sil"
        message={`"${deleteContactName}" temsilcisini silmek istediğinizden emin misiniz? Bağlı fırsatların temsilci ataması kaldırılacak.`}
        loading={deleteContact.isPending}
      />
    </>
  );
}
