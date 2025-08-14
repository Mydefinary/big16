// src/EnhancedRecommendationSystem.js - TF-IDF 기반 향상된 추천 시스템 UI
import React, { useState, useEffect } from 'react';
import { useEnhancedRecommendations, useSimilarityAnalysis, useEnhancedWebtoonData } from './hooks/useTFIDFData';

const EnhancedRecommendationSystem = () => {
  const { webtoons, healthStatus } = useEnhancedWebtoonData();
  const { recommendations, loading: recLoading, getRecommendations, analysisMethod } = useEnhancedRecommendations();
  const { similarityData, loading: simLoading, analyzeSimilarity } = useSimilarityAnalysis();
  
  const [selectedWebtoon, setSelectedWebtoon] = useState('');
  const [useTfidf, setUseTfidf] = useState(true);
  const [tfidfWeight, setTfidfWeight] = useState(0.4);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWebtoon1, setCompareWebtoon1] = useState('');
  const [compareWebtoon2, setCompareWebtoon2] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // 추천 실행
  const handleRecommendation = async () => {
    if (!selectedWebtoon) return;
    
    await getRecommendations(selectedWebtoon, {
      limit: 6,
      useTfidf,
      tfidfWeight
    });
  };

  // 유사도 비교 실행
  const handleSimilarityComparison = async () => {
    if (!compareWebtoon1 || !compareWebtoon2) return;
    await analyzeSimilarity(compareWebtoon1, compareWebtoon2);
  };

  // 유사도에 따른 색상 계산
  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.8) return 'bg-red-500';
    if (similarity >= 0.6) return 'bg-orange-500';
    if (similarity >= 0.4) return 'bg-yellow-500';
    if (similarity >= 0.2) return 'bg-green-500';
    return 'bg-gray-400';
  };

  // 유사도 레벨 텍스트
  const getSimilarityLevel = (similarity) => {
    if (similarity >= 0.8) return '매우 높음';
    if (similarity >= 0.6) return '높음';
    if (similarity >= 0.4) return '보통';
    if (similarity >= 0.2) return '낮음';
    return '매우 낮음';
  };

  return (
    <div className="w-full space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 AI 향상된 추천 시스템</h2>
        <p className="text-gray-600">
          TF-IDF 줄거리 분석과 태그 매칭을 결합한 차세대 웹툰 추천 엔진
        </p>
        
        {/* 상태 표시 */}
        <div className="mt-4 flex justify-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            healthStatus?.tfidf_ready ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            TF-IDF 엔진: {healthStatus?.tfidf_ready ? '활성화' : '기본모드'}
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            분석 웹툰: {webtoons.length}개
          </div>
        </div>
      </div>

      {/* 모드 선택 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => setCompareMode(false)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              !compareMode 
                ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 웹툰 추천
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              compareMode 
                ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔗 유사도 비교
          </button>
        </div>

        {!compareMode ? (
          /* 추천 모드 */
          <div className="space-y-6">
            {/* 웹툰 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추천받을 웹툰을 선택하세요:
              </label>
              <select 
                value={selectedWebtoon}
                onChange={(e) => setSelectedWebtoon(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
              >
                <option value="">웹툰을 선택하세요...</option>
                {webtoons.map(webtoon => (
                  <option key={webtoon.title} value={webtoon.title}>
                    {webtoon.title} (평점: {webtoon.rating})
                  </option>
                ))}
              </select>
            </div>

            {/* 고급 설정 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">고급 설정</h4>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showDetails ? '숨기기' : '보기'}
                </button>
              </div>

              {showDetails && (
                <div className="space-y-4">
                  {/* TF-IDF 사용 여부 */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="useTfidf"
                      checked={useTfidf}
                      onChange={(e) => setUseTfidf(e.target.checked)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useTfidf" className="text-sm font-medium text-gray-700">
                      TF-IDF 줄거리 분석 사용 (더 정확한 추천)
                    </label>
                  </div>

                  {/* TF-IDF 가중치 설정 */}
                  {useTfidf && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TF-IDF 가중치: {Math.round(tfidfWeight * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.7"
                        step="0.1"
                        value={tfidfWeight}
                        onChange={(e) => setTfidfWeight(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>태그 중심 (10%)</span>
                        <span>균형 (40%)</span>
                        <span>줄거리 중심 (70%)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 추천 실행 버튼 */}
            <button
              onClick={handleRecommendation}
              disabled={!selectedWebtoon || recLoading}
              className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {recLoading ? '분석 중...' : useTfidf ? '🤖 AI 추천 분석' : '📊 기본 추천 분석'}
            </button>
          </div>
        ) : (
          /* 비교 모드 */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 첫 번째 웹툰 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  첫 번째 웹툰:
                </label>
                <select 
                  value={compareWebtoon1}
                  onChange={(e) => setCompareWebtoon1(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">웹툰 선택...</option>
                  {webtoons.map(webtoon => (
                    <option key={webtoon.title} value={webtoon.title}>
                      {webtoon.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 두 번째 웹툰 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  두 번째 웹툰:
                </label>
                <select 
                  value={compareWebtoon2}
                  onChange={(e) => setCompareWebtoon2(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">웹툰 선택...</option>
                  {webtoons.map(webtoon => (
                    <option key={webtoon.title} value={webtoon.title}>
                      {webtoon.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 비교 실행 버튼 */}
            <button
              onClick={handleSimilarityComparison}
              disabled={!compareWebtoon1 || !compareWebtoon2 || simLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {simLoading ? '분석 중...' : '🔍 유사도 상세 분석'}
            </button>
          </div>
        )}
      </div>

      {/* 추천 결과 */}
      {!compareMode && selectedWebtoon && recommendations.length > 0 && (
        <div className="space-y-6">
          {/* 추천 헤더 */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-2">'{selectedWebtoon}'을(를) 좋아한다면...</h3>
            <p className="opacity-90">
              {useTfidf ? 'AI 분석 결과' : '기본 분석 결과'} • 
              분석 방법: {analysisMethod === 'hybrid_tfidf_tags' ? 'TF-IDF + 태그 하이브리드' : '태그 기반'}
            </p>
          </div>

          {/* 추천 웹툰 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                {/* 순위 배지 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">
                    #{index + 1}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{rec.title}</div>
                    <div className="text-sm text-gray-600">평점 {rec.rating}</div>
                  </div>
                </div>

                {/* 유사도 정보 */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">전체 유사도</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-green-600">
                        {(rec.similarity * 100).toFixed(1)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${getSimilarityColor(rec.similarity)}`}
                          style={{ width: `${rec.similarity * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {useTfidf && rec.tfidf_similarity !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">줄거리 유사도</span>
                      <span className="font-medium text-blue-600">
                        {(rec.tfidf_similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">태그 유사도</span>
                    <span className="font-medium text-purple-600">
                      {(rec.jaccard_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 공통 태그 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">공통 태그:</div>
                  <div className="flex flex-wrap gap-1">
                    {(rec.common_tags || []).map(tag => (
                      <span key={tag} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* TF-IDF 키워드 (있는 경우) */}
                {useTfidf && rec.candidate_keywords && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">줄거리 키워드:</div>
                    <div className="flex flex-wrap gap-1">
                      {rec.candidate_keywords.slice(0, 3).map(keyword => (
                        <span key={keyword} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추가 정보 */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>조회수: {rec.interest_count.toLocaleString()}</div>
                  <div>타겟: {rec.gender} {rec.ages}</div>
                  <div>추천 이유: {getSimilarityLevel(rec.similarity)} 유사성</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 유사도 비교 결과 */}
      {compareMode && similarityData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-2">🔍</span>
            상세 유사도 분석 결과
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 웹툰 정보 */}
            <div className="space-y-6">
              {/* 첫 번째 웹툰 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-lg text-gray-800 mb-3">{similarityData.webtoon1.title}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">줄거리:</span>
                    <p className="text-gray-700 mt-1 leading-relaxed">
                      {similarityData.webtoon1.summary.substring(0, 200)}...
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">태그:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {similarityData.webtoon1.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {similarityData.webtoon1.keywords.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">핵심 키워드:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {similarityData.webtoon1.keywords.slice(0, 5).map(kw => (
                          <span key={kw.keyword} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {kw.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 두 번째 웹툰 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-lg text-gray-800 mb-3">{similarityData.webtoon2.title}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">줄거리:</span>
                    <p className="text-gray-700 mt-1 leading-relaxed">
                      {similarityData.webtoon2.summary.substring(0, 200)}...
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">태그:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {similarityData.webtoon2.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {similarityData.webtoon2.keywords.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">핵심 키워드:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {similarityData.webtoon2.keywords.slice(0, 5).map(kw => (
                          <span key={kw.keyword} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {kw.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 분석 결과 */}
            <div className="space-y-6">
              {/* 유사도 점수 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-4">유사도 점수</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">전체 유사도</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-3 bg-gray-200 rounded-full">
                        <div 
                          className={`h-3 rounded-full ${getSimilarityColor(similarityData.similarity_analysis.final_similarity)}`}
                          style={{ width: `${similarityData.similarity_analysis.final_similarity * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">
                        {(similarityData.similarity_analysis.final_similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">태그 유사도</span>
                    <span className="font-medium">
                      {(similarityData.similarity_analysis.jaccard_similarity * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">줄거리 유사도</span>
                    <span className="font-medium">
                      {(similarityData.similarity_analysis.tfidf_similarity * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">평점 유사도</span>
                    <span className="font-medium">
                      {(similarityData.similarity_analysis.rating_similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 공통 요소 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-4">공통 요소</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-600">공통 태그:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {similarityData.comparison.common_tags.map(tag => (
                        <span key={tag} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {similarityData.comparison.common_keywords.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">공통 키워드:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {similarityData.comparison.common_keywords.map(keyword => (
                          <span key={keyword} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <div>평점 차이: {similarityData.comparison.rating_difference.toFixed(2)}점</div>
                    <div>인기도 비율: {similarityData.comparison.popularity_ratio.toFixed(2)}:1</div>
                  </div>
                </div>
              </div>

              {/* 결론 */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">분석 결론</h4>
                <p className="text-blue-700 text-sm">
                  {similarityData.similarity_analysis.final_similarity >= 0.6 
                    ? '매우 유사한 웹툰입니다. 하나를 좋아한다면 다른 하나도 추천합니다!' 
                    : similarityData.similarity_analysis.final_similarity >= 0.4
                    ? '어느 정도 유사성이 있는 웹툰입니다. 비슷한 요소들을 공유합니다.'
                    : '상당히 다른 스타일의 웹툰입니다. 각각 고유한 매력을 가지고 있습니다.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {(recLoading || simLoading) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {recLoading ? 'AI 추천 분석 중...' : '유사도 분석 중...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedRecommendationSystem;