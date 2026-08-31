import {
  CategoryButton,
  Grid,
  Header,
  ManageButton,
  Shortcut,
} from './CategorySelector.styles';
import type { Category } from '../model/classification';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryIds: number[];
  disabled?: boolean;
  onManage: () => void;
  onToggle: (categoryId: number) => void;
}

export default function CategorySelector({
  categories,
  selectedCategoryIds,
  disabled = false,
  onManage,
  onToggle,
}: CategorySelectorProps) {
  return (
    <>
      <Header>
        <strong>카테고리 선택 · 여러 개 선택 가능</strong>
        <ManageButton disabled={disabled} type="button" onClick={onManage}>
          + 카테고리 관리
        </ManageButton>
      </Header>
      <Grid>
        {categories.map((category, index) => {
          const selected = selectedCategoryIds.includes(category.id);

          return (
            <CategoryButton
              key={category.id}
              aria-pressed={selected}
              disabled={disabled}
              selected={selected}
              type="button"
              onClick={() => onToggle(category.id)}
            >
              {category.name}
              {index < 9 && <Shortcut aria-hidden>{index + 1}</Shortcut>}
            </CategoryButton>
          );
        })}
      </Grid>
    </>
  );
}
