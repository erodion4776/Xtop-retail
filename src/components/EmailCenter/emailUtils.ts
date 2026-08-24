export const parseNameAndTags = (rawName: string | undefined): { name: string; tags: string[] } => {
  if (!rawName) return { name: '', tags: [] };
  const tags: string[] = [];
  const tagRegex = /\[([^\]]+)\]/g;
  let match;
  let cleanName = rawName;
  while ((match = tagRegex.exec(rawName)) !== null) {
    if (match[1].trim()) tags.push(match[1].trim());
  }
  cleanName = cleanName.replace(/\[[^\]]+\]/g, '').trim();
  return { name: cleanName, tags };
};

export const combineNameAndTags = (cleanName: string, tags: string[]): string => {
  const formattedTags = tags.filter(t => t.trim()).map(t => `[${t.trim()}]`).join(' ');
  return `${cleanName.trim()} ${formattedTags}`.trim();
};

export const getEmailDomainTag = (email: string): string => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail.')) return 'GMAIL';
  if (domain.includes('outlook.') || domain.includes('hotmail.')) return 'MICROSOFT';
  if (domain.endsWith('.edu')) return 'EDU';
  return domain.toUpperCase();
};
