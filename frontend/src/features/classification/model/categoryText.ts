import { normalizeCategoryName } from './category';
import type { Category } from './classification';

const CATEGORY_SEPARATOR = /[,，;\n]/;

export interface CategoryTextResolution {
  categoryIds: number[];
  categoryNames: string[];
  unknownCategoryNames: string[];
}

export const parseCategoryNames = (value: string) => {
  const namesByNormalizedName = new Map<string, string>();

  value.split(CATEGORY_SEPARATOR).forEach((name) => {
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    const normalizedName = normalizeCategoryName(trimmedName);

    if (trimmedName && !namesByNormalizedName.has(normalizedName)) {
      namesByNormalizedName.set(normalizedName, trimmedName);
    }
  });

  return [...namesByNormalizedName.values()];
};

export const formatCategoryText = (categoryNames: string[]) =>
  parseCategoryNames(categoryNames.join(', ')).join(', ');

export const formatCategoryTextByIds = (
  categoryIds: number[],
  categories: Category[],
) =>
  formatCategoryText(
    categoryIds.flatMap((categoryId) => {
      const category = categories.find(({ id }) => id === categoryId);
      return category ? [category.name] : [];
    }),
  );

export const resolveCategoryText = (
  value: string,
  categories: Category[],
): CategoryTextResolution => {
  const categoryNames = parseCategoryNames(value);
  const categoriesByName = new Map(
    categories.map((category) => [
      normalizeCategoryName(category.name),
      category,
    ]),
  );
  const categoryIds: number[] = [];
  const unknownCategoryNames: string[] = [];

  categoryNames.forEach((name) => {
    const category = categoriesByName.get(normalizeCategoryName(name));

    if (category) {
      categoryIds.push(category.id);
      return;
    }

    unknownCategoryNames.push(name);
  });

  return { categoryIds, categoryNames, unknownCategoryNames };
};

export const appendCategoryText = (value: string, categoryName: string) =>
  formatCategoryText([...parseCategoryNames(value), categoryName]);

export const removeCategoryText = (value: string, categoryName: string) => {
  const targetName = normalizeCategoryName(categoryName);

  return formatCategoryText(
    parseCategoryNames(value).filter(
      (name) => normalizeCategoryName(name) !== targetName,
    ),
  );
};
