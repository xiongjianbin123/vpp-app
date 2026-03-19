import { mockNews } from '../mock/data';
import type { NewsItem } from '../mock/data';

export async function getNews(category?: string): Promise<NewsItem[]> {
  if (!category) return mockNews;
  return mockNews.filter(n => n.category === category);
}
