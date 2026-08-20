/** Русское склонение по количеству: 1 позиция / 2 позиции / 5 позиций. */
export function pluralItems(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'позиция';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции';
  return 'позиций';
}

/** Русское склонение блюд: 1 блюдо / 2 блюда / 5 блюд. */
export function pluralDishes(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'блюдо';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'блюда';
  return 'блюд';
}

/** Русское склонение гостей: 1 гость / 2 гостя / 5 гостей. */
export function pluralGuests(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'гость';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'гостя';
  return 'гостей';
}
