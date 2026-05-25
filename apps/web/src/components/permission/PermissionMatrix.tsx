'use client';

import {
  PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  type Permission,
} from '@crm/shared';

interface PermissionMatrixProps {
  selectedPermissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  isAdmin?: boolean;
  disabled?: boolean;
}

export function PermissionMatrix({
  selectedPermissions,
  onChange,
  isAdmin = false,
  disabled = false,
}: PermissionMatrixProps) {
  const handleToggle = (permission: Permission) => {
    if (disabled || isAdmin) return;

    const next = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission];

    onChange(next);
  };

  if (isAdmin) {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-[13px] text-violet-300/80">
          Admin kullanıcıların yetkileri değiştirilemez. Tüm sayfalara ve işlemlere tam erişimleri bulunmaktadır.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {PERMISSIONS.map((permission) => {
        const checked = selectedPermissions.includes(permission);
        return (
          <label
            key={permission}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-150 ${
              checked
                ? 'border-violet-500/40 bg-violet-500/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            onClick={() => handleToggle(permission)}
          >
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/30 bg-white/5">
              {checked && (
                <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 12 12">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[14px] font-semibold ${checked ? 'text-white' : 'text-white/70'}`}>
                {PERMISSION_LABELS[permission]}
              </span>
              <span className="text-[12px] leading-relaxed text-white/45">
                {PERMISSION_DESCRIPTIONS[permission]}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
