import type { UserRole } from '@crm/shared';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

export function getNavForRole(role: UserRole | undefined): {
  main: NavLink[];
  admin: NavSection | null;
} {
  const main: NavLink[] = [{ href: '/fairs', label: 'Fuarlar' }];

  if (role === 'admin') {
    return {
      main,
      admin: {
        title: 'Yönetim',
        links: [
          { href: '/admin/users', label: 'Kullanıcı Yönetimi' },
          { href: '/admin/products', label: 'Ürün Listesi' },
          { href: '/admin/settings', label: 'Sistem Ayarları' },
          { href: '/admin/audit-log', label: 'İşlem Geçmişi' },
        ],
      },
    };
  }

  return { main, admin: null };
}
