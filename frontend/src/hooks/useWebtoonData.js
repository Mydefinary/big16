// src/hooks/useWebtoonData.js
import { useState, useEffect, useCallback } from 'react';
import WebtoonAPI from '../services/api';

// 웹툰 데이터 hook
export const useWebtoonData = () => {
  const [webtoons, setWebtoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchWebtoons();
      setWebtoons(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch webtoons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { webtoons, loading, error, refetch: fetchData };
};

// 태그 분석 hook (기존 호환성)
export const useTagAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchTagAnalysis();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch tag analysis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { analysisData, loading, error, refetch: fetchData };
};

// 새로운 네트워크 분석 hook
export const useNetworkAnalysis = () => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNetworkData = useCallback(async (selectedTags = [], minCorrelation = 0.2, maxNodes = 30) => {
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchNetworkAnalysis(selectedTags, minCorrelation, maxNodes);
      setNetworkData(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch network analysis:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);

  return { 
    networkData, 
    loading, 
    error, 
    fetchNetworkData,
    refetch: () => fetchNetworkData()
  };
};

// 관련 태그 hook
export const useRelatedTags = () => {
  const [relatedTags, setRelatedTags] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRelatedTags = useCallback(async (tag, limit = 10) => {
    if (!tag) return null;
    
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchRelatedTags(tag, limit);
      setRelatedTags(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch related tags:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { relatedTags, loading, error, fetchRelatedTags };
};

// 히트맵 데이터 hook
export const useHeatmapData = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchHeatmapData();
      setHeatmapData(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch heatmap data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { heatmapData, loading, error, refetch: fetchData };
};

// 통계 데이터 hook
export const useStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchStatistics();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, loading, error, refetch: fetchData };
};

// 추천 시스템 hook
export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRecommendations = useCallback(async (title, limit = 5) => {
    if (!title) return [];

    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchRecommendations(title, limit);
      setRecommendations(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch recommendations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, loading, error, getRecommendations };
};

// 인사이트 데이터 hook
export const useInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WebtoonAPI.fetchInsights();
      setInsights(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { insights, loading, error, refetch: fetchData };
};

// 통합 hook (모든 데이터를 한번에)
export const useAllWebtoonData = () => {
  const webtoonData = useWebtoonData();
  const tagAnalysis = useTagAnalysis();
  const heatmapData = useHeatmapData();
  const statistics = useStatistics();
  const insights = useInsights();

  const isLoading = webtoonData.loading || tagAnalysis.loading || 
                   heatmapData.loading || statistics.loading || insights.loading;
                   
  const hasError = webtoonData.error || tagAnalysis.error || 
                  heatmapData.error || statistics.error || insights.error;

  const refetchAll = useCallback(() => {
    webtoonData.refetch();
    tagAnalysis.refetch();
    heatmapData.refetch();
    statistics.refetch();
    insights.refetch();
  }, [webtoonData, tagAnalysis, heatmapData, statistics, insights]);

  return {
    // 개별 데이터
    webtoons: webtoonData.webtoons,
    analysisData: tagAnalysis.analysisData,
    heatmapData: heatmapData.heatmapData,
    stats: statistics.stats,
    insights: insights.insights,
    
    // 상태
    isLoading,
    hasError,
    
    // 함수
    refetchAll,
    
    // 개별 상태 (필요시)
    individual: {
      webtoonData,
      tagAnalysis,
      heatmapData,
      statistics,
      insights
    }
  };
};