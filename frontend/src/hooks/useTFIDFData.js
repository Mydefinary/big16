// src/hooks/useTFIDFData.js - TF-IDF 관련 커스텀 훅들
import { useState, useEffect, useCallback } from 'react';
import EnhancedWebtoonAPI from '../services/enhanced_api';

// TF-IDF 분석 데이터 hook
export const useTFIDFAnalysis = () => {
  const [tfidfData, setTfidfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedWebtoonAPI.fetchTFIDFAnalysis();
      setTfidfData(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch TF-IDF analysis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tfidfData, loading, error, refetch: fetchData };
};

// 키워드 추출 hook
export const useKeywordExtraction = () => {
  const [keywords, setKeywords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractKeywords = useCallback(async (text, maxKeywords = 10) => {
    if (!text || text.trim().length === 0) {
      setKeywords(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedWebtoonAPI.extractSummaryKeywords(text, maxKeywords);
      setKeywords(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to extract keywords:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearKeywords = useCallback(() => {
    setKeywords(null);
    setError(null);
  }, []);

  return { 
    keywords, 
    loading, 
    error, 
    extractKeywords, 
    clearKeywords 
  };
};

// 향상된 추천 시스템 hook
export const useEnhancedRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisMethod, setAnalysisMethod] = useState(null);

  const getRecommendations = useCallback(async (title, options = {}) => {
    if (!title) {
      setRecommendations([]);
      return [];
    }

    const {
      limit = 5,
      useTfidf = true,
      tfidfWeight = 0.4
    } = options;

    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedWebtoonAPI.fetchEnhancedRecommendations(
        title, 
        limit, 
        useTfidf, 
        tfidfWeight
      );
      
      setRecommendations(data);
      setAnalysisMethod(data.length > 0 ? data[0].analysis_method : null);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch enhanced recommendations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setAnalysisMethod(null);
    setError(null);
  }, []);

  return { 
    recommendations, 
    loading, 
    error, 
    analysisMethod,
    getRecommendations, 
    clearRecommendations 
  };
};

// 유사도 분석 hook
export const useSimilarityAnalysis = () => {
  const [similarityData, setSimilarityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeSimilarity = useCallback(async (title1, title2) => {
    if (!title1 || !title2) {
      setSimilarityData(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedWebtoonAPI.fetchSimilarityAnalysis(title1, title2);
      setSimilarityData(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to analyze similarity:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setSimilarityData(null);
    setError(null);
  }, []);

  return { 
    similarityData, 
    loading, 
    error, 
    analyzeSimilarity, 
    clearAnalysis 
  };
};

// 향상된 웹툰 데이터 hook (TF-IDF 지원)
export const useEnhancedWebtoonData = () => {
  const [webtoons, setWebtoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 헬스 체크 먼저 수행
      const health = await EnhancedWebtoonAPI.checkHealth();
      setHealthStatus(health);
      
      // 웹툰 데이터 로드
      const data = await EnhancedWebtoonAPI.fetchWebtoons();
      setWebtoons(data);
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch enhanced webtoon data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    webtoons, 
    loading, 
    error, 
    healthStatus,
    refetch: fetchData 
  };
};

// 통합 TF-IDF 분석 hook (모든 TF-IDF 기능을 한번에)
export const useIntegratedTFIDF = () => {
  const tfidfAnalysis = useTFIDFAnalysis();
  const keywordExtraction = useKeywordExtraction();
  const enhancedRecommendations = useEnhancedRecommendations();
  const similarityAnalysis = useSimilarityAnalysis();
  const webtoonData = useEnhancedWebtoonData();

  const isLoading = tfidfAnalysis.loading || webtoonData.loading;
  const hasError = tfidfAnalysis.error || webtoonData.error;
  const isTfidfReady = webtoonData.healthStatus?.tfidf_ready;

  const refetchAll = useCallback(() => {
    tfidfAnalysis.refetch();
    webtoonData.refetch();
    keywordExtraction.clearKeywords();
    enhancedRecommendations.clearRecommendations();
    similarityAnalysis.clearAnalysis();
  }, [tfidfAnalysis, webtoonData, keywordExtraction, enhancedRecommendations, similarityAnalysis]);

  return {
    // 기본 데이터
    webtoons: webtoonData.webtoons,
    tfidfData: tfidfAnalysis.tfidfData,
    
    // 상태
    isLoading,
    hasError,
    isTfidfReady,
    healthStatus: webtoonData.healthStatus,
    
    // 개별 기능들
    keywordExtraction,
    enhancedRecommendations,
    similarityAnalysis,
    
    // 유틸리티
    refetchAll,
    
    // 개별 모듈 접근 (필요시)
    modules: {
      tfidfAnalysis,
      webtoonData,
      keywordExtraction,
      enhancedRecommendations,
      similarityAnalysis
    }
  };
};

// TF-IDF 통계 hook
export const useTFIDFStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedWebtoonAPI.fetchStatistics();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch TF-IDF stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};