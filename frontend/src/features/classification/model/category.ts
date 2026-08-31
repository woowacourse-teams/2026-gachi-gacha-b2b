import type { Category } from './classification';

export const normalizeCategoryName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');

export const isDuplicateCategory = (categories: Category[], name: string) => {
  const normalizedName = normalizeCategoryName(name);

  return categories.some(
    (category) => normalizeCategoryName(category.name) === normalizedName,
  );
};

export const toggleCategory = (categoryIds: number[], categoryId: number) => {
  if (categoryIds.includes(categoryId)) {
    return categoryIds.filter((id) => id !== categoryId);
  }

  return [...categoryIds, categoryId];
};
