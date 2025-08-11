// src/hooks/useWebtoonData.js
import { useState, useEffect } from 'react';
import WebtoonAPI from '../services/api';

// 웹툰 데이터 hook
export const useWebtoonData = () => {
  const [webtoons, setWebtoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {  // 함수를 useEffect 내부에 정의
      try {
        setLoading(true);
        const data = await WebtoonAPI.fetchWebtoons();
        setWebtoons(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('웹툰 데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    const loadData = async () => {  // refreshData 내부에도 정의
      try {
        setLoading(true);
        const data = await WebtoonAPI.fetchWebtoons();
        setWebtoons(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('웹툰 데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    
    await loadData();
  };

  return { webtoons, loading, error, refreshData };
};

// 태그 분석 데이터 hook
export const useTagAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const data = await WebtoonAPI.fetchTagAnalysis();
        setAnalysisData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('태그 분석 데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, []);

  return { analysisData, loading, error };
};

// 히트맵 데이터 hook
export const useHeatmapData = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHeatmap = async () => {
      try {
        setLoading(true);
        const data = await WebtoonAPI.fetchHeatmapData();
        setHeatmapData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('히트맵 데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHeatmap();
  }, []);

  return { heatmapData, loading, error };
};

// 통계 데이터 hook
export const useStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await WebtoonAPI.fetchStatistics();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('통계 데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return { stats, loading, error };
};

// 추천 데이터 hook
export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRecommendations = async (title, limit = 5) => {
    try {
      setLoading(true);
      const data = await WebtoonAPI.fetchRecommendations(title, limit);
      setRecommendations(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('추천 데이터 로딩 실패:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading, error, getRecommendations };
};