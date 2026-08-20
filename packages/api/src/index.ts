// Слой доступа к данным Food. Приложения ходят сюда, а не в Supabase напрямую:
// экран не должен знать ни про таблицы, ни про форму строк.
export * from './client';
export * from './menu';
export * from './orders';
export * from './floor';
export * from './kitchen';
export * from './service';
export * from './auth';
export * from './staff';
export * from './messages';
export type { Database } from './database.types';
