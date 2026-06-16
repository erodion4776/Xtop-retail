export const siteConfigs = [
  {
    "siteKey": "cyvisahelp",
    "brandName": "CY Visa Help",
    "senderName": "CY Visa Help Team",
    "website": "https://cyvisahelp.com",
    "logo": "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=100&h=100&fit=crop",
    "primaryColor": "#0f172a"
  },
  {
    "siteKey": "cybarprep",
    "brandName": "CY Bar Prep",
    "senderName": "CY Bar Prep Support",
    "website": "https://cybarprep.com",
    "logo": "https://images.unsplash.com/photo-1589829545856-d44a1edb928f?w=100&h=100&fit=crop",
    "primaryColor": "#b91c1c"
  },
  {
    "siteKey": "cylawtech",
    "brandName": "CY Law Tech",
    "senderName": "CY Law Tech Team",
    "website": "https://cylawtech.com",
    "logo": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100&h=100&fit=crop",
    "primaryColor": "#1d4ed8"
  }
];

export const getSiteConfig = (siteKey: string) => siteConfigs.find(s => s.siteKey === siteKey);
