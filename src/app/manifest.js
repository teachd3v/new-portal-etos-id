export default function manifest() {
  return {
    name: 'Portal Etos ID',
    short_name: 'Etos Portal',
    description: 'Portal Pembinaan & Monitoring Kepemimpinan Etos ID',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F766E',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Dashboard Etoser',
        url: '/etoser',
        description: 'Buka Dashboard Etoser'
      },
      {
        name: 'Dashboard Fasilitator',
        url: '/fasil',
        description: 'Buka Dashboard Fasilitator'
      },
      {
        name: 'Dashboard Admin',
        url: '/admin',
        description: 'Buka Dashboard Administrator'
      }
    ]
  };
}
