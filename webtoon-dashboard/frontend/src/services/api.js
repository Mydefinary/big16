// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class WebtoonAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // 웹툰 데이터 조회
  async fetchWebtoons() {
    try {
      const data = await this.request('/api/webtoons');
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching webtoons:', error);
      return this.getFallbackWebtoons(); // 백엔드 없을 때 임시 데이터
    }
  }

  // 태그 분석 데이터 조회
  async fetchTagAnalysis() {
    try {
      const data = await this.request('/api/analysis/tags');
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching tag analysis:', error);
      return this.getFallbackTagAnalysis();
    }
  }

  // 히트맵 데이터 조회
  async fetchHeatmapData() {
    try {
      const data = await this.request('/api/analysis/heatmap');
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      return this.getFallbackHeatmapData();
    }
  }

  // 추천 데이터 조회
  async fetchRecommendations(title, limit = 5) {
    try {
      const data = await this.request('/api/recommendations', {
        method: 'POST',
        body: JSON.stringify({ title, limit }),
      });
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return this.getFallbackRecommendations(title);
    }
  }

  // 통계 데이터 조회
  async fetchStatistics() {
    try {
      const data = await this.request('/api/stats');
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return this.getFallbackStatistics();
    }
  }

  // 백엔드가 없을 때 사용할 임시 데이터들
  getFallbackWebtoons() {
    return [
      { rank: 1, title: "화산귀환", tags: ["회귀", "무협/사극", "액션", "명작"], interest_count: 1534623, rating: 9.88, gender: "남성", ages: "20대" },
      { rank: 2, title: "신의 탑", tags: ["이능력", "액션", "판타지", "성장물"], interest_count: 1910544, rating: 9.84, gender: "남성", ages: "20대" },
      { rank: 3, title: "외모최강주의", tags: ["드라마", "학원액션", "소년물", "격투기"], interest_count: 824399, rating: 9.40, gender: "남성", ages: "10대" },
      { rank: 4, title: "마른 가지에 바람처럼", tags: ["로맨스", "순정남", "서양", "왕족/귀족"], interest_count: 458809, rating: 9.97, gender: "여성", ages: "10대" },
      { rank: 5, title: "엄마를 만나러 가는 길", tags: ["판타지", "모험", "감성적인", "러블리"], interest_count: 259146, rating: 9.98, gender: "여성", ages: "10대" },
    ];
  }

  getFallbackTagAnalysis() {
    const webtoons = this.getFallbackWebtoons();
    const tagFrequency = {};
    
    webtoons.forEach(item => {
      item.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    return {
      tag_frequency: Object.entries(tagFrequency).sort(([,a], [,b]) => b - a),
      network_nodes: Object.entries(tagFrequency).map(([tag, count]) => ({
        id: tag, count, size: count * 5
      })),
      network_links: []
    };
  }

  getFallbackHeatmapData() {
    return [
      { x: 0, y: 0, value: 2, genre: "로맨스", demographic: "남성-10대", count: 2 },
      { x: 1, y: 0, value: 1, genre: "액션", demographic: "남성-10대", count: 1 },
      // ... 더 많은 데이터
    ];
  }

  getFallbackRecommendations(title) {
    const webtoons = this.getFallbackWebtoons();
    return webtoons.filter(w => w.title !== title).slice(0, 3).map(w => ({
      ...w,
      similarity: Math.random() * 0.8 + 0.2,
      common_tags: w.tags.slice(0, 2)
    }));
  }

  getFallbackStatistics() {
    return {
      total_webtoons: 3164,
      avg_rating: 9.67,
      avg_interest: 645000,
      unique_tags: 127
    };
  }
}

export default new WebtoonAPI();