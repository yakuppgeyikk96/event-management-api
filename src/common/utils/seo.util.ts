export function generateMetaTitle(title: string): string {
  return `${title} | Event Management`;
}

export function generateMetaDescription(description: string): string {
  const cleanDescription = description.replace(/<[^>]*>/g, '');
  return cleanDescription.length > 160
    ? cleanDescription.substring(0, 157) + '...'
    : cleanDescription;
}
