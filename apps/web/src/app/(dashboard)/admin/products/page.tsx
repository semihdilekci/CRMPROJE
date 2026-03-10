'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductFormModal } from '@/components/product/ProductFormModal';
import { useProducts, useDeleteProduct, useProductCustomerCount } from '@/hooks/use-products';
import type { Product } from '@crm/shared';

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products, isLoading } = useProducts(search.trim() || undefined);
  const { data: customerCount } = useProductCustomerCount(deleteTarget?.id ?? null);
  const deleteProduct = useDeleteProduct();

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error shown in dialog
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar breadcrumb="Yönetim › Ürün Listesi" />
      <ContentWrapper>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-serif text-[22px] font-semibold text-text">İlgilenilen Ürünler</h1>
          <Button onClick={handleAdd}>+ Yeni Ürün</Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Ürün adı ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[280px]"
          />
        </div>

        {isLoading ? (
          <p className="text-muted">Yükleniyor...</p>
        ) : products && products.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[400px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 font-semibold text-text">Ürün adı</th>
                  <th className="px-4 py-3 font-semibold text-text">Açıklama</th>
                  <th className="px-4 py-3 font-semibold text-text">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border/70 hover:bg-surface/50">
                    <td className="px-4 py-3 text-text">{product.name}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                      {product.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="text-[13px] text-accent hover:underline"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="text-[13px] text-danger hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted">
              {search ? 'Arama kriterine uygun ürün yok.' : 'Henüz ürün yok.'}
            </p>
            {!search && (
              <Button onClick={handleAdd} className="mt-4">
                + İlk Ürünü Ekle
              </Button>
            )}
          </div>
        )}
      </ContentWrapper>

      <ProductFormModal
        open={showModal}
        onClose={handleCloseModal}
        initial={editingProduct ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          deleteProduct.reset();
        }}
        onConfirm={handleDeleteConfirm}
        title="Ürünü sil"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" ürününü silmek istediğinize emin misiniz?${
                customerCount !== undefined && customerCount > 0
                  ? ` Bu ürün ${customerCount} fırsat tarafından kullanılıyor.`
                  : ''
              }`
            : ''
        }
        confirmLabel="Sil"
        loading={deleteProduct.isPending}
        error={
          deleteProduct.isError && deleteProduct.error
            ? String(
                (deleteProduct.error as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? 'Silme işlemi başarısız'
              )
            : undefined
        }
      />
    </div>
  );
}
