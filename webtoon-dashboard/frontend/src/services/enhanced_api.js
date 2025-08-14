// src/services/enhanced_api.js - TF-IDF 기능이 추가된 API 서비스
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class EnhancedWebtoonAPI {
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

  // 기존 API들
  async fetchWebtoons() {
    try {
      const data = await this.request('/api/webtoons');
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching webtoons:', error);
      return this.getFallbackWebtoons();
    }
  }

  async fetchTagAnalysis() {
    try {
      const data = await this.request('/api/analysis/tags');
      if (data.success) {
        return {
          tag_frequency: data.data.tag_frequency,
          network_nodes: data.data.tag_frequency.slice(0, 20).map(([tag, count]) => ({
            id: tag,
            count: count,
            size: Math.min(count * 3, 50)
          })),
          network_links: []
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching tag analysis:', error);
      return this.getFallbackTagAnalysis();
    }
  }

  // 새로운 TF-IDF API들
  async fetchTFIDFAnalysis() {
    try {
      console.log('🔍 TF-IDF 분석 요청 중...');
      const data = await this.request('/api/analysis/tfidf');
      console.log('✅ TF-IDF 분석 응답:', data);
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ TF-IDF 분석 실패:', error);
      return this.getFallbackTFIDFAnalysis();
    }
  }

  async extractSummaryKeywords(text, maxKeywords = 10) {
    try {
      console.log('🔍 키워드 추출 요청:', text.substring(0, 50) + '...');
      const data = await this.request('/api/analysis/summary-keywords', {
        method: 'POST',
        body: JSON.stringify({ 
          text: text, 
          max_keywords: maxKeywords 
        }),
      });
      console.log('✅ 키워드 추출 완료:', data);
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ 키워드 추출 실패:', error);
      return null;
    }
  }

  async fetchEnhancedRecommendations(title, limit = 5, useTfidf = true, tfidfWeight = 0.4) {
    try {
      console.log(`🎯 향상된 추천 요청: ${title} (TF-IDF: ${useTfidf})`);
      const data = await this.request('/api/recommendations/enhanced', {
        method: 'POST',
        body: JSON.stringify({ 
          title, 
          limit, 
          use_tfidf: useTfidf,
          tfidf_weight: tfidfWeight
        }),
      });
      console.log('✅ 향상된 추천 완료:', data);
      return data.success ? data.data : [];
    } catch (error) {
      console.error('❌ 향상된 추천 실패:', error);
      return this.getFallbackRecommendations(title);
    }
  }

  async fetchSimilarityAnalysis(title1, title2) {
    try {
      console.log(`🔗 유사도 분석 요청: ${title1} vs ${title2}`);
      const data = await this.request(`/api/analysis/similarity/${encodeURIComponent(title1)}/${encodeURIComponent(title2)}`);
      console.log('✅ 유사도 분석 완료:', data);
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ 유사도 분석 실패:', error);
      return null;
    }
  }

  async fetchStatistics() {
    try {
      const data = await this.request('/api/stats');
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return this.getFallbackStatistics();
    }
  }

  async checkHealth() {
    try {
      const data = await this.request('/health');
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', tfidf_ready: false };
    }
  }

  // Fallback 데이터들
  getFallbackWebtoons() {
    return [
      { 
        rank: 1, title: "화산귀환", 
        summary: "대 화산파 13대 제자. 천하삼대검수 매화검존 청명. 천하를 혼란에 빠뜨린 고금제일마 천마의 목을 치고 십만대산의 정상에서 영면. 백 년의 시간을 뛰어넘어 아이의 몸으로 다시 살아나다.",
        tags: ["회귀", "무협", "액션", "명작"], 
        interest_count: 1534623, rating: 9.88, gender: "남성", ages: "20대" 
      },
      { 
        rank: 2, title: "신의 탑", 
        summary: "신의 탑 꼭대기에는 모든 것이 있다고 한다. 탑에 들어가 시험을 통과하면서 위로 올라가는 이야기. 각 층마다 다른 시험과 강력한 적들이 기다리고 있다.",
        tags: ["판타지", "액션", "성장"], 
        interest_count: 1910544, rating: 9.84, gender: "남성", ages: "20대" 
      },
      { 
        rank: 3, title: "외모지상주의", 
        summary: "못생긴 외모 때문에 괴롭힘을 당하던 주인공이 어느 날 잘생긴 몸으로 바뀌면서 겪는 이야기. 외모에 따른 차별과 사회 문제를 다룬다.",
        tags: ["드라마", "학원", "액션"], 
        interest_count: 824399, rating: 9.40, gender: "남성", ages: "10대" 
      },
      { 
        rank: 4, title: "마른 가지에 바람처럼", 
        summary: "가난한 백작 가문의 딸이 정략결혼을 통해 공작가로 시집가면서 펼쳐지는 로맨스. 냉정한 공작과 따뜻한 마음을 가진 여주인공의 사랑 이야기.",
        tags: ["로맨스", "귀족", "서양"], 
        interest_count: 458809, rating: 9.97, gender: "여성", ages: "10대" 
      },
      { 
        rank: 5, title: "나 혼자만 레벨업", 
        summary: "세계에 던전과 헌터가 나타난 지 10여 년. 성진우는 E급 헌터다. 어느 날 이중 던전에서 죽을 뻔한 순간, 시스템이 나타나며 레벨업을 할 수 있게 된다.",
        tags: ["액션", "게임", "판타지", "성장"], 
        interest_count: 2156789, rating: 9.91, gender: "남성", ages: "20대" 
      },
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

  getFallbackTFIDFAnalysis() {
    return {
      global_keywords: [
        { keyword: '주인공', avg_score: 0.85, rank: 1 },
        { keyword: '이야기', avg_score: 0.72, rank: 2 },
        { keyword: '세계', avg_score: 0.68, rank: 3 },
        { keyword: '능력', avg_score: 0.65, rank: 4 },
        { keyword: '성장', avg_score: 0.62, rank: 5 },
        { keyword: '사랑', avg_score: 0.58, rank: 6 },
        { keyword: '모험', avg_score: 0.55, rank: 7 },
        { keyword: '학원', avg_score: 0.52, rank: 8 },
        { keyword: '판타지', avg_score: 0.48, rank: 9 },
        { keyword: '로맨스', avg_score: 0.45, rank: 10 }
      ],
      webtoon_keywords: {
        "화산귀원": [
          { keyword: '화산파', score: 0.92, rank: 1 },
          { keyword: '검수', score: 0.87, rank: 2 },
          { keyword: '천마', score: 0.82, rank: 3 }
        ],
        "신의 탑": [
          { keyword: '시험', score: 0.89, rank: 1 },
          { keyword: '꼭대기', score: 0.84, rank: 2 },
          { keyword: '층마다', score: 0.78, rank: 3 }
        ]
      },
      total_features: 1000,
      total_documents: 5,
      analysis_method: "TF-IDF with Korean preprocessing"
    };
  }

  getFallbackRecommendations(title) {
    const webtoons = this.getFallbackWebtoons();
    return webtoons.filter(w => w.title !== title).slice(0, 3).map(w => ({
      ...w,
      similarity: Math.random() * 0.8 + 0.2,
      jaccard_similarity: Math.random() * 0.6 + 0.2,
      tfidf_similarity: Math.random() * 0.7 + 0.1,
      common_tags: w.tags.slice(0, 2),
      target_keywords: ['주인공', '이야기'],
      candidate_keywords: ['능력', '성장'],
      analysis_method: 'hybrid_tfidf_tags'
    }));
  }

  getFallbackStatistics() {
    return {
      total_webtoons: 5,
      avg_rating: 9.67,
      avg_interest: 645000,
      unique_tags: 15,
      tfidf_features: 1000,
      analysis_enhanced: true
    };
  }
}

export default new EnhancedWebtoonAPI();