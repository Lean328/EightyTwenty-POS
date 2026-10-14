import type { MenuItem } from '../../domain/types';

export interface PosMenuItemDto {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  dietary: string[];
  imageUrl: string | null;
  featured: boolean;
  available: boolean;
  modifierGroups: {
    id: string;
    name: string;
    required: boolean;
    maxSelections: number;
    options: {
      name: string;
      priceCents: number;
    }[];
  }[];
}

export function mapMenuItem(dto: PosMenuItemDto): MenuItem {
  return {
    id: dto.id,
    cat: dto.categoryId,
    name: dto.name,
    price: dto.priceCents / 100,
    diet: dto.dietary,
    img: dto.imageUrl ?? '',
    desc: dto.description,
    featured: dto.featured,
    mods: dto.modifierGroups.map((group) => ({
      id: group.id,
      name: group.name,
      required: group.required,
      max: group.maxSelections,
      options: group.options.map(
        (option): [string, number] => [
          option.name,
          option.priceCents / 100,
        ],
      ),
    })),
  };
}

export function mapMenu(dtos: PosMenuItemDto[]) {
  return {
    menu: dtos.map(mapMenuItem),
    unavailableItemIds: dtos
      .filter((item) => !item.available)
      .map((item) => item.id),
  };
}