import type { NewsItem } from '../mock/data';

const BIZ_KEY = 'vpp_wechat_biz';
const PROXY = 'https://api.allorigins.win/get?url=';
const RSSHUB = 'https://rsshub.app/wechat/mp/article/';

export function getWechatBiz(): string {
  return localStorage.getItem(BIZ_KEY) ?? '';
}

export function setWechatBiz(biz: string): void {
  localStorage.setItem(BIZ_KEY, biz.trim());
}

export async function fetchWechatNews(): Promise<NewsItem[]> {
  const biz = getWechatBiz();
  if (!biz) return [];

  const rssUrl = encodeURIComponent(RSSHUB + biz);
  const res = await fetch(PROXY + rssUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];

  const json = await res.json();
  const xmlStr: string = json.contents ?? '';
  if (!xmlStr) return [];

  const xml = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const today = new Date().toISOString().slice(0, 10);

  return Array.from(xml.querySelectorAll('item'))
    .map((item, i) => {
      const pubDate = item.querySelector('pubDate')?.textContent ?? '';
      const date = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : '';
      const title = item.querySelector('title')?.textContent?.trim() ?? '';
      const link = item.querySelector('link')?.textContent?.trim() ?? '';
      const desc = item.querySelector('description')?.textContent ?? '';
      const summary = desc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
      return {
        id: `wx_${today}_${i}`,
        title,
        summary: summary || '（点击标题查看原文）',
        source: '虚拟电厂公众号',
        date,
        category: mapCategory(title),
        tags: ['公众号', '虚拟电厂'],
        url: link,
      } satisfies NewsItem;
    })
    .filter(item => item.date === today)
    .slice(0, 2);
}

function mapCategory(title: string): NewsItem['category'] {
  if (/现货|电价|交易|出清|中标/.test(title)) return '现货市场';
  if (/政策|法规|意见|通知|标准|规范|办法|条例/.test(title)) return '政策法规';
  if (/储能|电池|充电|放电|飞轮/.test(title)) return '储能动态';
  if (/需求响应|负荷|DR/.test(title)) return '需求响应';
  if (/价格|行情|煤价|锂价|电价预测/.test(title)) return '价格行情';
  return '政策法规';
}
