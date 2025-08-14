// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://webtoon-analytics-backend-production.up.railway.app';

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
      return this.getFallbackWebtoons();
    }
  }

  // 태그 분석 데이터 조회 (기존 호환성 유지)
  async fetchTagAnalysis() {
    try {
      const data = await this.request('/api/analysis/tags');
      if (data.success) {
        // 기존 App.js 구조에 맞게 변환
        return {
          tag_frequency: data.data.tag_frequency,
          network_nodes: data.data.tag_frequency.slice(0, 20).map(([tag, count]) => ({
            id: tag,
            count: count,
            size: Math.min(count * 3, 50)
          })),
          network_links: [] // 기존 구조 호환
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching tag analysis:', error);
      return this.getFallbackTagAnalysis();
    }
  }

  // 새로운 네트워크 분석 데이터 조회
  async fetchNetworkAnalysis(selectedTags = [], minCorrelation = 0.2, maxNodes = 30) {
    try {
      const params = new URLSearchParams({
        min_correlation: minCorrelation,
        max_nodes: maxNodes
      });
      
      if (selectedTags.length > 0) {
        params.append('selected_tags', selectedTags.join(','));
      }

      const url = `/api/analysis/network?${params}`;
      console.log('네트워크 API 요청 URL:', `${this.baseURL}${url}`);
      const data = await this.request(url);
      console.log('네트워크 API 응답:', data);
      
      if (data.success) {
        console.log('✅ 백엔드 네트워크 데이터 사용 - 노드 수:', data.data.nodes?.length);
        return data;  // 전체 응답 반환 (data.data가 아닌 data)
      } else {
        console.log('❌ 백엔드 응답 실패, fallback 사용');
        return this.getFallbackNetworkData();
      }
    } catch (error) {
      console.error('❌ 네트워크 API 오류, fallback 사용:', error);
      return this.getFallbackNetworkData();
    }
  }

  // 관련 태그 조회
  async fetchRelatedTags(tag, limit = 10) {
    try {
      const data = await this.request(`/api/analysis/related-tags/${encodeURIComponent(tag)}?limit=${limit}`);
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching related tags:', error);
      return null;
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

  // 인사이트 데이터 조회 (새로 추가)
  async fetchInsights() {
    try {
      const data = await this.request('/api/analysis/insights');
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching insights:', error);
      return this.getFallbackInsights();
    }
  }

  // Fallback 데이터들
  getFallbackWebtoons() {
    return [
      { rank: 1, title: "화산귀환", tags: ["회귀", "무협", "액션", "명작"], interest_count: 1534623, rating: 9.88, gender: "남성", ages: "20대" },
      { rank: 2, title: "신의 탑", tags: ["판타지", "액션", "성장"], interest_count: 1910544, rating: 9.84, gender: "남성", ages: "20대" },
      { rank: 3, title: "외모지상주의", tags: ["드라마", "학원", "액션"], interest_count: 824399, rating: 9.40, gender: "남성", ages: "10대" },
      { rank: 4, title: "마른 가지에 바람처럼", tags: ["로맨스", "귀족", "서양"], interest_count: 458809, rating: 9.97, gender: "여성", ages: "10대" },
      { rank: 5, title: "엄마를 만나러 가는 길", tags: ["판타지", "모험", "일상"], interest_count: 259146, rating: 9.98, gender: "여성", ages: "10대" },
      { rank: 6, title: "재혼 황후", tags: ["로맨스", "귀족", "서양", "복수"], interest_count: 892456, rating: 9.75, gender: "여성", ages: "20대" },
      { rank: 7, title: "나 혼자만 레벨업", tags: ["액션", "게임", "판타지", "성장"], interest_count: 2156789, rating: 9.91, gender: "남성", ages: "20대" },
      { rank: 8, title: "여신강림", tags: ["로맨스", "학원", "일상", "코미디"], interest_count: 1345678, rating: 9.62, gender: "여성", ages: "10대" },
      { rank: 9, title: "이태원 클라쓰", tags: ["드라마", "현실", "성장"], interest_count: 987654, rating: 9.55, gender: "남성", ages: "30대" },
      { rank: 10, title: "유미의 세포들", tags: ["로맨스", "일상", "드라마"], interest_count: 756432, rating: 9.33, gender: "여성", ages: "30대" },
      { rank: 11, title: "전지적 독자 시점", tags: ["회귀", "판타지", "액션", "성장"], interest_count: 1823456, rating: 9.92, gender: "남성", ages: "20대" },
      { rank: 12, title: "악역의 엔딩은 죽음뿐", tags: ["로맨스", "회귀", "판타지", "귀족"], interest_count: 734521, rating: 9.78, gender: "여성", ages: "20대" },
      { rank: 13, title: "나의 수학선생", tags: ["로맨스", "학원", "드라마", "일상"], interest_count: 654321, rating: 9.45, gender: "여성", ages: "20대" },
      { rank: 14, title: "대학원 탈출일지", tags: ["일상", "코미디", "현실"], interest_count: 543210, rating: 9.23, gender: "남성", ages: "20대" },
      { rank: 15, title: "기기괴괴", tags: ["스릴러", "호러", "단편"], interest_count: 432109, rating: 9.34, gender: "남성", ages: "20대" },
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

    const sortedTags = Object.entries(tagFrequency).sort(([,a], [,b]) => b - a);

    return {
      tag_frequency: sortedTags,
      network_nodes: sortedTags.map(([tag, count]) => ({
        id: tag, 
        count, 
        size: Math.min(count * 5, 50)
      })),
      network_links: []
    };
  }

  getFallbackNetworkData() {
    return {
      nodes: [
        { id: '로맨스', count: 8, influence: 0.85, size: 45, group: '장르', selected: false, avg_rating: 9.65 },
        { id: '액션', count: 7, influence: 0.78, size: 38, group: '장르', selected: false, avg_rating: 9.45 },
        { id: '판타지', count: 6, influence: 0.72, size: 35, group: '장르', selected: false, avg_rating: 9.52 },
        { id: '드라마', count: 5, influence: 0.68, size: 32, group: '장르', selected: false, avg_rating: 9.38 },
        { id: '회귀', count: 3, influence: 0.65, size: 28, group: '테마', selected: false, avg_rating: 9.67 },
        { id: '성장', count: 4, influence: 0.62, size: 30, group: '테마', selected: false, avg_rating: 9.41 },
        { id: '학원', count: 3, influence: 0.58, size: 26, group: '테마', selected: false, avg_rating: 9.33 },
        { id: '일상', count: 4, influence: 0.52, size: 25, group: '장르', selected: false, avg_rating: 9.21 },
        { id: '귀족', count: 2, influence: 0.48, size: 22, group: '설정', selected: false, avg_rating: 9.72 },
        { id: '현실', count: 2, influence: 0.42, size: 23, group: '테마', selected: false, avg_rating: 9.15 },
      ],
      links: [
        { source: '로맨스', target: '드라마', value: 0.82, width: 6, co_occurrence: 4.5 },
        { source: '로맨스', target: '학원', value: 0.76, width: 5, co_occurrence: 3.2 },
        { source: '로맨스', target: '귀족', value: 0.71, width: 5, co_occurrence: 2.8 },
        { source: '액션', target: '판타지', value: 0.85, width: 7, co_occurrence: 5.1 },
        { source: '액션', target: '성장', value: 0.79, width: 6, co_occurrence: 4.3 },
        { source: '액션', target: '회귀', value: 0.74, width: 5, co_occurrence: 3.6 },
        { source: '판타지', target: '회귀', value: 0.77, width: 6, co_occurrence: 3.9 },
        { source: '드라마', target: '현실', value: 0.69, width: 4, co_occurrence: 2.2 },
        { source: '드라마', target: '일상', value: 0.65, width: 4, co_occurrence: 3.1 },
        { source: '학원', target: '일상', value: 0.62, width: 3, co_occurrence: 2.8 },
      ],
      summary: {
        total_nodes: 10,
        total_links: 10,
        selected_tags: [],
        max_correlation: 0.85,
        avg_correlation: 0.68
      }
    };
  }

  getFallbackHeatmapData() {
    const genres = ['로맨스', '액션', '판타지', '드라마', '무협', '일상'];
    const demographics = ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대'];
    const data = [];
    
    demographics.forEach((demo, y) => {
      genres.forEach((genre, x) => {
        const count = Math.floor(Math.random() * 10) + 1;
        data.push({
          x, y, value: count, genre, demographic: demo, count,
          intensity: count / 10
        });
      });
    });
    
    return data;
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
      total_webtoons: 15,
      avg_rating: 9.67,
      avg_interest: 645000,
      unique_tags: 25,
      gender_distribution: { "남성": 8, "여성": 7 },
      age_distribution: { "10대": 4, "20대": 9, "30대": 2 }
    };
  }

  getFallbackInsights() {
    return {
      trending_tags: [['로맨스', 8], ['액션', 7], ['판타지', 6]],
      male_preferences: [['액션', 5], ['판타지', 4], ['회귀', 3]],
      female_preferences: [['로맨스', 6], ['드라마', 4], ['일상', 3]],
      quality_indicators: [['명작', 9.88], ['회귀', 9.67], ['귀족', 9.72]],
      insights: {
        most_popular_genre: '로맨스',
        gender_difference: 3,
        quality_vs_popularity: '평점과 인기도의 상관관계 분석 결과'
      }
    };
  }
}

export default new WebtoonAPI();