// src/EnhancedApp.js - TF-IDF 기능이 통합된 메인 대시보드
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ResponsiveContainer } from 'recharts';
import { useTagAnalysis, useHeatmapData, useStatistics } from './hooks/useWebtoonData';
import { useIntegratedTFIDF } from './hooks/useTFIDFData';
import NetworkVisualization from './NetworkVisualization';
import TFIDFVisualization from './TFIDFVisualization';
import EnhancedRecommendationSystem from './EnhancedRecommendationSystem';

const EnhancedWebtoonAnalyticsDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // 기존 데이터 hooks
  const { analysisData, loading: analysisLoading, error: analysisError } = useTagAnalysis();
  const { heatmapData, loading: heatmapLoading, error: heatmapError } = useHeatmapData();
  const { stats, loading: statsLoading, error: statsError } = useStatistics();
  
  // 새로운 TF-IDF 통합 hook
  const {
    webtoons,
    tfidfData,
    isLoading: tfidfLoading,
    hasError: tfidfError,
    isTfidfReady,
    healthStatus
  } = useIntegratedTFIDF();

  // 로딩 상태 처리
  const isLoading = analysisLoading || statsLoading || tfidfLoading;
  const hasError = analysisError || statsError || tfidfError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">AI 분석 시스템 로딩 중...</h2>
          <p className="text-gray-600">TF-IDF 엔진과 웹툰 데이터를 초기화하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-xl border border-gray-200 p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">연결 오류</h2>
          <p className="text-gray-600 mb-4">
            백엔드 서버에 연결할 수 없습니다.<br/>
            {isTfidfReady ? 'TF-IDF 기본 기능은 사용 가능합니다.' : '기본 모드로 실행됩니다.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 실제 통계 데이터 사용 (fallback 포함)
  const displayStats = stats || {
    total_webtoons: webtoons.length,
    avg_rating: webtoons.length > 0 ? (webtoons.reduce((sum, w) => sum + w.rating, 0) / webtoons.length).toFixed(2) : 0,
    avg_interest: webtoons.length > 0 ? Math.round(webtoons.reduce((sum, w) => sum + w.interest_count, 0) / webtoons.length) : 0,
    unique_tags: 127,
    tfidf_features: 0,
    analysis_enhanced: isTfidfReady
  };

  const tabs = [
    { id: 'overview', name: '전체 개요', icon: '📊', color: 'bg-green-600' },
    { id: 'tfidf', name: 'TF-IDF 분석', icon: '🔍', color: 'bg-purple-600', badge: isTfidfReady ? 'AI' : 'NEW' },
    { id: 'network', name: '태그 네트워크', icon: '🕸️', color: 'bg-green-600' },
    { id: 'recommend', name: 'AI 추천', icon: '🎯', color: 'bg-blue-600', badge: isTfidfReady ? 'Enhanced' : null },
    { id: 'heatmap', name: '히트맵 분석', icon: '🔥', color: 'bg-orange-600' }
  ];

  // 히트맵 컴포넌트 (기존과 동일)
  const CustomHeatmap = () => {
    const maxValue = heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 1;
    
    const genres = ['로맨스', '액션', '판타지', '드라마', '무협/사극', '일상'];
    const demographics = ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대'];
    
    const getImprovedColor = (intensity) => {
      if (intensity === 0) return '#f8fafc';
      if (intensity < 0.2) return '#dcfce7';
      if (intensity < 0.4) return '#bbf7d0';
      if (intensity < 0.6) return '#86efac';
      if (intensity < 0.8) return '#4ade80';
      return '#16a34a';
    };
    
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-center text-green-700">성별 × 연령대 × 장르 히트맵</h3>
        <div className="grid grid-cols-7 gap-1 text-xs">
          <div></div>
          {genres.map(genre => (
            <div key={genre} className="p-2 text-center font-semibold">{genre}</div>
          ))}
          
          {demographics.map(demo => (
            <React.Fragment key={demo}>
              <div className="p-2 font-semibold text-right pr-4">{demo}</div>
              {genres.map(genre => {
                const dataPoint = heatmapData.find(d => d.demographic === demo && d.genre === genre);
                const intensity = dataPoint ? dataPoint.count / maxValue : 0;
                
                return (
                  <div
                    key={`${demo}-${genre}`}
                    className="p-3 text-center font-bold rounded transition-all duration-300 hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: getImprovedColor(intensity),
                      color: intensity > 0.5 ? 'white' : '#374151'
                    }}
                    title={`${demo} - ${genre}: ${dataPoint?.count || 0}개`}
                  >
                    {dataPoint?.count || 0}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 헤더 - 향상된 정보 포함 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-green-700 mb-4">
            🎨 웹툰 AI 분석 대시보드
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            TF-IDF 기반 줄거리 분석 + AI 추천 시스템
          </p>
          
          {/* 시스템 상태 표시 */}
          <div className="flex justify-center space-x-4 mb-6">
            <div className={`rounded-full px-4 py-2 text-sm font-medium ${
              isTfidfReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isTfidfReady ? '🤖 AI 엔진 활성화' : '📊 기본 모드'}
            </div>
            {healthStatus?.konlpy_available && (
              <div className="bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium">
                🇰🇷 한국어 NLP 지원
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-6">
            <div className="bg-white rounded-full px-6 py-3 border border-gray-200">
              <span className="text-sm font-medium text-gray-600">총 웹툰: </span>
              <span className="text-sm font-bold text-green-600">{displayStats.total_webtoons.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 border border-gray-200">
              <span className="text-sm font-medium text-gray-600">평균 평점: </span>
              <span className="text-sm font-bold text-green-600">{displayStats.avg_rating}</span>
            </div>
            {displayStats.tfidf_features > 0 && (
              <div className="bg-white rounded-full px-6 py-3 border border-gray-200">
                <span className="text-sm font-medium text-gray-600">AI 특성: </span>
                <span className="text-sm font-bold text-purple-600">{displayStats.tfidf_features.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 - 향상된 디자인 */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 flex space-x-2 shadow-lg">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`relative px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  selectedTab === tab.id
                    ? `${tab.color} text-white transform scale-105 shadow-lg`
                    : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.name}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 전체 개요 탭 */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* 주요 지표 카드 - TF-IDF 정보 추가 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: '총 웹툰 수', value: displayStats.total_webtoons.toLocaleString(), subtitle: '분석 대상', icon: '📚' },
                { title: '평균 평점', value: displayStats.avg_rating, subtitle: '10점 만점', icon: '⭐' },
                { title: '평균 조회수', value: `${Math.round(displayStats.avg_interest / 1000)}K`, subtitle: '월간 기준', icon: '👀' },
                { 
                  title: 'AI 특성 수', 
                  value: displayStats.tfidf_features > 0 ? displayStats.tfidf_features.toLocaleString() : '기본모드', 
                  subtitle: isTfidfReady ? 'TF-IDF 활성' : '태그 기반', 
                  icon: '🤖' 
                }
              ].map((card, index) => (
                <div key={index} className="text-white rounded-xl p-6 border border-gray-200 transform hover:scale-105 transition-all duration-300" 
                     style={{backgroundColor: index === 3 && isTfidfReady ? '#8b5cf6' : '#6D8196'}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">{card.icon}</div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{card.value}</div>
                      <div className="text-sm opacity-80">{card.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-sm opacity-90">{card.title}</div>
                </div>
              ))}
            </div>

            {/* 차트 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 인기 태그 차트 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  인기 태그 TOP 10
                </h3>
                
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={(analysisData?.tag_frequency || []).slice(0, 10).map(([tag, count], index) => {
                      const getTagCategory = (tag) => {
                        const romance = ['로맨스', '순정', '소꿉친구', '첫사랑', '연애', '완결로맨스'];
                        const action = ['액션', '판타지', '무협', '회귀', '환생', '레벨업','완결액션','완결판타지'];
                        const daily = ['일상','드라마', '가족', '개그', '직장', '학원','완결일상'];
                        
                        if (romance.some(r => tag.includes(r))) return { color: '#16a34a', category: '로맨스' };
                        if (action.some(a => tag.includes(a))) return { color: '#6D8196', category: '액션/판타지' };
                        if (daily.some(d => tag.includes(d))) return { color: '#059669', category: '일상/드라마' };
                        return { color: '#94a3b8', category: '기타' };
                      };
                      
                      const category = getTagCategory(tag);
                      return { 
                        tag, 
                        count, 
                        fill: category.color,
                        category: category.category,
                        rank: index + 1
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="tag" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      label={{ value: '웹툰 개수', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        color: '#374151', 
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 평점 vs 조회수 산점도 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
                  <span className="mr-2">💎</span>
                  평점 vs 조회수 관계분석
                </h3>

                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      dataKey="interest_count" 
                      name="조회수" 
                      scale="log"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value/1000).toFixed(0)}K`;
                        return value.toString();
                      }}
                      label={{ value: '조회수 (로그 스케일)', position: 'insideBottom', offset: -10, style: { fill: '#6b7280' } }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="rating" 
                      name="평점" 
                      domain={['dataMin', 'dataMax']}
                      tick={{ fill: '#6b7280' }}
                      label={{ value: '평점', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                    />
                    
                    <Scatter 
                      name="고조회수 (1M+)" 
                      data={webtoons.filter(w => w.interest_count >= 1000000)} 
                      fill="#059669"
                      fillOpacity={0.9}
                      r={4}
                    />
                    <Scatter 
                      name="중간조회수 (100K-1M)" 
                      data={webtoons.filter(w => w.interest_count >= 100000 && w.interest_count < 1000000)} 
                      fill="#16a34a"
                      fillOpacity={0.7}
                      r={3}
                    />
                    <Scatter 
                      name="저조회수 (100K 미만)" 
                      data={webtoons.filter(w => w.interest_count < 100000)} 
                      fill="#6D8196"
                      fillOpacity={0.5}
                      r={2}
                    />
                    
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 p-4 rounded-xl max-w-xs">
                              <p className="font-bold text-gray-800 mb-2">{data.title}</p>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium text-gray-600">평점:</span> <span className="font-bold">{data.rating}</span></p>
                                <p><span className="font-medium text-gray-600">조회수:</span> <span className="font-bold">{data.interest_count.toLocaleString()}</span></p>
                                <p><span className="font-medium text-gray-600">태그:</span> {data.tags.slice(0, 3).join(', ')}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TF-IDF 분석 탭 */}
        {selectedTab === 'tfidf' && (
          <TFIDFVisualization />
        )}
        
        {/* 태그 네트워크 탭 */}
        {selectedTab === 'network' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🕸️ 태그 연관성 네트워크</h2>
              <p className="text-gray-600">태그 간의 연관관계를 시각화하여 웹툰 트렌드를 파악합니다</p>
            </div>
            
            <NetworkVisualization 
              analysisData={analysisData}
              width={900}
              height={700}
              className="mb-6"
            />
          </div>
        )}

        {/* AI 추천 시스템 탭 */}
        {selectedTab === 'recommend' && (
          <EnhancedRecommendationSystem />
        )}

        {/* 히트맵 분석 탭 */}
        {selectedTab === 'heatmap' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-green-700 mb-2">🔥 다차원 히트맵 분석</h2>
              <p className="text-gray-600">성별, 연령대, 장르 간의 복합적 관계를 시각화합니다</p>
            </div>
            
            <CustomHeatmap />
          </div>
        )}

        {/* 푸터 - 향상된 정보 */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">💡 AI 기반 인사이트</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-cyan-400 font-bold">TF-IDF 분석</div>
                <div className="opacity-80">
                  {isTfidfReady 
                    ? '줄거리 텍스트에서 핵심 키워드를 자동 추출하여 더 정확한 추천 제공'
                    : '기본 태그 기반 분석으로 웹툰 간 연관성 파악'}
                </div>
              </div>
              <div>
                <div className="text-green-400 font-bold">하이브리드 추천</div>
                <div className="opacity-80">
                  {isTfidfReady 
                    ? '태그 유사도와 줄거리 유사도를 결합한 AI 추천 시스템'
                    : '태그 기반 Jaccard 유사도를 활용한 추천 시스템'}
                </div>
              </div>
              <div>
                <div className="text-purple-400 font-bold">한국어 최적화</div>
                <div className="opacity-80">
                  {healthStatus?.konlpy_available 
                    ? '형태소 분석기를 활용한 정밀한 한국어 자연어 처리'
                    : '기본 한국어 처리로 웹툰 도메인 특화 분석'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWebtoonAnalyticsDashboard;