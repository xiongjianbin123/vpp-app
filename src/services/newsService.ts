import { mockNews } from '../mock/data';
import { fetchWechatNews } from './wechatNewsService';
import type { NewsItem } from '../mock/data';

export async function getNews(category?: string): Promise<NewsItem[]> {
  const [wechatResult] = await Promise.allSettled([fetchWechatNews()]);
  const wechatItems = wechatResult.status === 'fulfilled' ? wechatResult.value : [];

  let all: NewsItem[] = [...wechatItems, ...mockNews];
  if (category) all = all.filter(n => n.category === category);
  return all;
}
