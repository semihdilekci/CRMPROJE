'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, updateUserSchema } from '@crm/shared';
import type { CreateUserDto, UpdateUserDto } from '@crm/shared';
import type { User } from '@crm/shared';
import { ROLES } from '@crm/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateUser, useUpdateUser } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: User;
}

type CreateFormData = CreateUserDto;
type EditFormData = UpdateUserDto & { password?: string };

export function UserFormModal({ open, onClose, initial }: UserFormModalProps) {
  const isEdit = !!initial;
  const [submitError, setSubmitError] = useState('');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: teams } = useTeams(undefined, true);
  const loading = createUser.isPending || updateUser.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    mode: 'onTouched',
    defaultValues: isEdit
      ? { name: initial.name, role: initial.role, teamId: initial.teamId ?? '' }
      : { name: '', email: '', password: '', role: 'user', teamId: '' },
  });

  useEffect(() => {
    if (!open) {
      setSubmitError('');
      return;
    }
    if (initial) {
      reset({ name: initial.name, role: initial.role, teamId: initial.teamId ?? '' });
    } else {
      reset({ name: '', email: '', password: '', role: 'user', teamId: '' });
    }
  }, [open, initial, reset]);

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    setSubmitError('');
    try {
      if (isEdit && initial) {
        const dto: UpdateUserDto = { name: data.name, role: data.role };
        if ((data as EditFormData).password?.trim()) {
          dto.password = (data as EditFormData).password;
        }
        if ((data as EditFormData).teamId) {
          dto.teamId = (data as EditFormData).teamId;
        }
        await updateUser.mutateAsync({ id: initial.id, dto });
      } else {
        await createUser.mutateAsync(data as CreateUserDto);
      }
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt sırasında bir hata oluştu.';
      setSubmitError(message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{submitError}</p>
        )}
        <Input
          label="Ad Soyad"
          placeholder="Ad soyad"
          {...register('name')}
          error={(errors as Record<string, { message?: string }>).name?.message}
        />
        {isEdit ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
              E-posta
            </label>
            <p className="rounded-[10px] border border-white/20 bg-white/5 px-3 py-2.5 text-[14px] text-white/60">
              {initial?.email}
            </p>
          </div>
        ) : (
          <Input
            label="E-posta"
            type="email"
            placeholder="ornek@email.com"
            {...register('email')}
            error={(errors as Record<string, { message?: string }>).email?.message}
          />
        )}
        {!isEdit ? (
          <Input
            label="Parola"
            type="password"
            placeholder="En az 6 karakter"
            {...register('password')}
            error={(errors as Record<string, { message?: string }>).password?.message}
          />
        ) : (
          <Input
            label="Geçici parola (opsiyonel)"
            type="password"
            placeholder="Değiştirmek için yeni parola"
            {...register('password')}
            error={(errors as Record<string, { message?: string }>).password?.message}
          />
        )}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
            Rol
          </label>
          <select
            className="w-full rounded-[10px] border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white focus:border-violet-400/60 focus:outline-none"
            {...register('role')}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === 'admin' ? 'Admin' : 'Kullanıcı'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/60">
            Ekip
          </label>
          <select
            className={`w-full rounded-[10px] border bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white focus:border-violet-400/60 focus:outline-none ${
              (errors as Record<string, { message?: string }>).teamId?.message
                ? 'border-danger'
                : 'border-white/20'
            }`}
            {...register('teamId')}
          >
            <option value="">Ekip seçiniz</option>
            {teams?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {(errors as Record<string, { message?: string }>).teamId?.message && (
            <p className="mt-1 text-[12px] text-danger">
              {(errors as Record<string, { message?: string }>).teamId?.message}
            </p>
          )}
        </div>
        <div className="mt-2 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
