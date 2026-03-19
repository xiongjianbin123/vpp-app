import api from './api';
import type { NewsItem } from '../mock/data';

export async function getNews(category?: string): Promise<NewsItem[]> {
  const params = category ? { category } : {};
  const res = await api.get<{ data: NewsItem[] }>('/news', { params });
  return res.data.data;
}
