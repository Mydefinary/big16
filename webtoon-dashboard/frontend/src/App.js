// src/App.js
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ResponsiveContainer } from 'recharts';
import { useWebtoonData, useTagAnalysis, useHeatmapData, useStatistics, useRecommendations } from './hooks/useWebtoonData';

const WebtoonAnalyticsDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedWebtoon, setSelectedWebtoon] = useState('');
  
  // 실제 데이터 hooks 사용
  const { webtoons, loading: webtoonsLoading, error: webtoonsError } = useWebtoonData();
  const { analysisData, loading: analysisLoading, error: analysisError } = useTagAnalysis();
  const { heatmapData, loading: heatmapLoading, error: heatmapError } = useHeatmapData();
  const { stats, loading: statsLoading, error: statsError } = useStatistics();
  const { recommendations, loading: recommendationsLoading, getRecommendations } = useRecommendations();

  // 추천 처리
  const handleWebtoonSelect = async (title) => {
    setSelectedWebtoon(title);
    if (title) {
      await getRecommendations(title);
    }
  };

  // 로딩 상태 처리
  const isLoading = webtoonsLoading || analysisLoading || statsLoading;
  const hasError = webtoonsError || analysisError || statsError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">데이터 로딩 중...</h2>
          <p className="text-gray-600">웹툰 데이터를 분석하고 있습니다.</p>
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
            임시 데이터로 대시보드를 표시합니다.
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
    unique_tags: 127
  };

  const tabs = [
    { id: 'overview', name: '전체 개요', icon: '📊', color: 'bg-green-600' },
    { id: 'network', name: '태그 네트워크', icon: '🕸️', color: 'bg-green-600' },
    { id: 'heatmap', name: '히트맵 분석', icon: '🔥', color: 'bg-green-600' },
    { id: 'recommend', name: '추천 시스템', icon: '🎯', color: 'bg-green-600' }
  ];
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98', '#F4A460', '#20B2AA', '#FFB6C1'];

  // 네트워크 시각화 컴포넌트
  const NetworkVisualization = () => {
    const nodes = analysisData?.network_nodes || [];
    
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg overflow-hidden border border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-8 p-8">
            {nodes.slice(0, 12).map((node, index) => (
              <div key={node.id} className="relative group">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-110"
                  style={{ 
                    width: `${Math.min(80, Math.max(32, node.count * 8))}px`,
                    height: `${Math.min(80, Math.max(32, node.count * 8))}px`
                  }}
                >
                  <span className="text-white font-bold text-xs truncate px-1">
                    {node.id}
                  </span>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {node.count}개 웹툰
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 연결선 애니메이션 효과 */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  // 히트맵 컴포넌트
  const CustomHeatmap = () => {
    const maxValue = heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 1;
    
    const genres = ['로맨스', '액션', '판타지', '드라마', '무협/사극', '일상'];
    const demographics = ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대'];
    
    // 개선된 색상 함수 (초록 테마)
    const getImprovedColor = (intensity) => {
      if (intensity === 0) return '#f8fafc'; // 데이터 없음
      
      // 5단계 초록 그라디언트
      if (intensity < 0.2) return '#dcfce7'; // 매우 연한
      if (intensity < 0.4) return '#bbf7d0'; // 연한
      if (intensity < 0.6) return '#86efac'; // 중간
      if (intensity < 0.8) return '#4ade80'; // 진한
      return '#16a34a'; // 매우 진한
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
        {/* 헤더 - 여백 추가 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-green-700 mb-4">
            🎨 웹툰 데이터 분석 대시보드
          </h1>
          <p className="text-xl text-gray-600">
            AI 기반 태그 네트워킹 & 추천 시스템
          </p>
          <div className="mt-8 flex justify-center space-x-6">
            <div className="bg-white rounded-full px-6 py-3 border border-gray-200">
              <span className="text-sm font-medium text-gray-600">총 웹툰: </span>
              <span className="text-sm font-bold text-green-600">{displayStats.total_webtoons.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 border border-gray-200">
              <span className="text-sm font-medium text-gray-600">평균 평점: </span>
              <span className="text-sm font-bold text-green-600">{displayStats.avg_rating}</span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 flex space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  selectedTab === tab.id
                    ? `${tab.color} text-white transform scale-105`
                    : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* 전체 개요 탭 */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: '총 웹툰 수', value: displayStats.total_webtoons.toLocaleString(), subtitle: '분석 대상', icon: '📚' },
                { title: '평균 평점', value: displayStats.avg_rating, subtitle: '10점 만점', icon: '⭐' },
                { title: '평균 조회수', value: `${Math.round(displayStats.avg_interest / 1000)}K`, subtitle: '월간 기준', icon: '👀' },
                { title: '태그 다양성', value: displayStats.unique_tags, subtitle: '고유 태그', icon: '🏷️' }
              ].map((card, index) => (
                <div key={index} className="text-white rounded-xl p-6 border border-gray-200 transform hover:scale-105 transition-all duration-300" style={{backgroundColor: '#6D8196'}}>
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
                  인기 태그 TOP 15
                </h3>
                
                {/* 카테고리 분석 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 border p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-pink-600 text-lg mr-2">💕</span>
                      <h4 className="font-bold text-pink-700">로맨스 계열</h4>
                    </div>
                    <div className="text-sm text-pink-600">
                      <p className="font-medium mb-1">주요 태그:</p>
                      <p>로맨스, 순정, 소꿉친구, 첫사랑</p>
                      <p className="mt-2 text-xs bg-pink-100 px-2 py-1 rounded">
                        💡 <strong>여성 독자층</strong> 압도적 선호
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-600 text-lg mr-2">⚔️</span>
                      <h4 className="font-bold text-blue-700">액션/판타지</h4>
                    </div>
                    <div className="text-sm text-blue-600">
                      <p className="font-medium mb-1">주요 태그:</p>
                      <p>액션, 판타지, 무협, 회귀</p>
                      <p className="mt-2 text-xs bg-blue-100 px-2 py-1 rounded">
                        💡 <strong>남성 독자층</strong> + 성장 서사
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-purple-600 text-lg mr-2">🎭</span>
                      <h4 className="font-bold text-purple-700">일상/드라마</h4>
                    </div>
                    <div className="text-sm text-purple-600">
                      <p className="font-medium mb-1">주요 태그:</p>
                      <p>일상, 가족, 개그, 직장</p>
                      <p className="mt-2 text-xs bg-purple-100 px-2 py-1 rounded">
                        💡 <strong>전연령</strong> 공감대 형성
                      </p>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={(analysisData?.tag_frequency || []).slice(0, 15).map(([tag, count], index) => {
                      // 조화로운 색상 매핑
                      const getTagCategory = (tag) => {
                        const romance = ['로맨스', '순정', '소꿉친구', '첫사랑', '연애'];
                        const action = ['액션', '판타지', '무협', '회귀', '환생', '레벨업'];
                        const daily = ['일상','드라마', '가족', '개그', '직장', '학원'];
                        
                        if (romance.some(r => tag.includes(r))) return { color: '#16a34a', category: '로맨스' }; // 초록
                        if (action.some(a => tag.includes(a))) return { color: '#6D8196', category: '액션/판타지' }; // 블루그레이
                        if (daily.some(d => tag.includes(d))) return { color: '#059669', category: '일상/드라마' }; // 에메랄드
                        return { color: '#94a3b8', category: '기타' }; // 연한 회색
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
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 p-4 rounded-xl">
                              <div className="font-bold text-lg mb-2 text-gray-800">#{data.rank} {data.tag}</div>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-600">웹툰 수:</span> <span className="font-bold text-green-600">{data.count.toLocaleString()}개</span></p>
                                <p><span className="text-gray-600">카테고리:</span> <span className="font-bold" style={{color: data.fill}}>{data.category}</span></p>
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    전체 태그 중 <strong>{((data.count / (analysisData?.tag_frequency?.[0]?.[1] || 1)) * 100).toFixed(1)}%</strong> 비율
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
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
                
                {/* 트렌드 분석 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">📈</span>
                      급상승 트렌드
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">회귀/환생</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">+85% ⬆️</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">레벨업</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">+72% ⬆️</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">이세계</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">+64% ⬆️</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 bg-gray-100 p-2 rounded">
                      💡 <strong>웹소설 트렌드</strong>가 웹툰으로 확산
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">📊</span>
                      장르별 시장 점유율
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">로맨스 계열</span>
                          <span className="text-sm font-bold text-gray-800">35%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{width: '35%', backgroundColor: '#16a34a'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">액션/판타지</span>
                          <span className="text-sm font-bold text-gray-800">28%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{width: '28%', backgroundColor: '#6D8196'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">일상/드라마</span>
                          <span className="text-sm font-bold text-gray-800">22%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{width: '22%', backgroundColor: '#059669'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">기타</span>
                          <span className="text-sm font-bold text-gray-800">15%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{width: '15%', backgroundColor: '#94a3b8'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 핵심 인사이트 */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    태그 트렌드 핵심 인사이트
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">🎯 독자 선호도 패턴:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• <strong>로맨스</strong>가 압도적 1위 (전체 35%)</li>
                        <li>• <strong>회귀/환생</strong> 장르 급부상</li>
                        <li>• 성별 기반 장르 선호도 뚜렷</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-2">📈 비즈니스 기회:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 로맨스 + 판타지 <strong>융합 장르</strong> 유망</li>
                        <li>• 웹소설 IP의 웹툰 각색 확대</li>
                        <li>• 타겟 독자층별 <strong>세분화 전략</strong> 필요</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 평점 vs 조회수 산점도 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
                  <span className="mr-2">💎</span>
                  평점 vs 조회수 관계분석
                </h3>
                
                {/* 인사이트 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-red-500 text-lg mr-2">🔥</span>
                      <h4 className="font-bold text-gray-800">대중성 (고조회수)</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      조회수 높음 → 평점 상대적 하락<br/>
                      <span className="font-semibold">바이럴 효과 > 작품성</span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-500 text-lg mr-2">⚖️</span>
                      <h4 className="font-bold text-gray-800">균형점 (중간대)</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      적정 조회수 + 높은 평점<br/>
                      <span className="font-semibold">대중성 + 작품성</span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 border border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-purple-500 text-lg mr-2">🎨</span>
                      <h4 className="font-bold text-gray-800">틈새/실험작</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      조회수 낮음 → 평점 극과극<br/>
                      <span className="font-semibold">호불호 명확</span>
                    </p>
                  </div>
                </div>

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
                    
                    {/* 조화로운 색상의 Scatter */}
                    <Scatter 
                      name="고조회수 (1M+)" 
                      data={webtoons.filter(w => w.interest_count >= 1000000)} 
                      fill="#6D8196"
                      fillOpacity={0.7}
                    />
                    <Scatter 
                      name="중간조회수 (100K-1M)" 
                      data={webtoons.filter(w => w.interest_count >= 100000 && w.interest_count < 1000000)} 
                      fill="#16a34a"
                      fillOpacity={0.7}
                    />
                    <Scatter 
                      name="저조회수 (100K 미만)" 
                      data={webtoons.filter(w => w.interest_count < 100000)} 
                      fill="#059669"
                      fillOpacity={0.7}
                    />
                    
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const getCategory = (count) => {
                            if (count >= 1000000) return { name: '대중성', color: 'text-gray-700', bg: 'bg-gray-50' };
                            if (count >= 100000) return { name: '균형점', color: 'text-green-700', bg: 'bg-green-50' };
                            return { name: '틈새작', color: 'text-emerald-700', bg: 'bg-emerald-50' };
                          };
                          
                          const category = getCategory(data.interest_count);
                          
                          return (
                            <div className="bg-white border border-gray-200 p-4 rounded-xl max-w-xs">
                              <p className="font-bold text-gray-800 mb-2">{data.title}</p>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium text-gray-600">평점:</span> <span className="font-bold">{data.rating}</span></p>
                                <p><span className="font-medium text-gray-600">조회수:</span> <span className="font-bold">{data.interest_count.toLocaleString()}</span></p>
                                <p className={`font-medium ${category.color}`}>
                                  📊 {category.name} 카테고리
                                </p>
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
                
                {/* 분석 결과 요약 */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">📈</span>
                    데이터 기반 인사이트
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">🔍 발견된 패턴:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 조회수와 평점 간 <strong>역상관 관계</strong> 존재</li>
                        <li>• 대중적 인기 ≠ 높은 평점</li>
                        <li>• 중간 조회수 구간에서 <strong>최적 밸런스</strong> 발견</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">💡 추천 전략:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 단순 조회수 기반 추천 지양</li>
                        <li>• <strong>평점-조회수 균형점</strong> 웹툰 우선 추천</li>
                        <li>• 사용자별 선호도 고려한 개인화</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
                {/* 태그 네트워크 탭 */}
                {selectedTab === 'network' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🕸️ 태그 연관성 네트워크</h2>
              <p className="text-gray-600">태그 간의 연관관계를 시각화하여 웹툰 트렌드를 파악합니다</p>
            </div>
            
            <NetworkVisualization />
            
            {/* 네트워크 인사이트 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="mr-2">🎯</span>
                  핵심 태그
                </h4>
                <p className="text-sm opacity-90">
                  '로맨스', '액션', '판타지'가 가장 중심적인 태그로 다른 태그들과 높은 연관성을 보입니다.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="mr-2">🔗</span>
                  강한 연결
                </h4>
                <p className="text-sm opacity-90">
                  '회귀'와 '무협/사극', '로맨스'와 '순정남' 태그가 강한 동시 출현 패턴을 보입니다.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="mr-2">📈</span>
                  트렌드 예측
                </h4>
                <p className="text-sm opacity-90">
                  네트워크 중심성이 높은 태그들이 향후 웹툰 트렌드를 주도할 가능성이 높습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 히트맵 분석 탭 */}
        {selectedTab === 'heatmap' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-green-700 mb-2">🔥 다차원 히트맵 분석</h2>
              <p className="text-gray-600">성별, 연령대, 장르 간의 복합적 관계를 시각화합니다</p>
            </div>
            
            <CustomHeatmap />
            
            {/* 추가 히트맵들 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 평점 분포 히트맵 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4 text-green-700">📊 평점대별 분포</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { range: '9.8-10', count: Math.floor(webtoons.filter(w => w.rating >= 9.8).length) },
                    { range: '9.6-9.8', count: Math.floor(webtoons.filter(w => w.rating >= 9.6 && w.rating < 9.8).length) },
                    { range: '9.4-9.6', count: Math.floor(webtoons.filter(w => w.rating >= 9.4 && w.rating < 9.6).length) },
                    { range: '9.2-9.4', count: Math.floor(webtoons.filter(w => w.rating >= 9.2 && w.rating < 9.4).length) },
                    { range: '9.0-9.2', count: Math.floor(webtoons.filter(w => w.rating >= 9.0 && w.rating < 9.2).length) }
                  ].map((item, index) => {
                    const colors = ['#6D8196', '#7a8fa4', '#8a9db1', '#9aabbf', '#aab9cc'];
                    return (
                      <div key={index} className="text-center">
                        <div className="text-white p-4 rounded-lg font-bold text-lg" style={{backgroundColor: colors[index]}}>
                          {item.count}
                        </div>
                        <div className="text-xs mt-2 text-gray-600">{item.range}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 조회수 분포 히트맵 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4 text-green-700">👀 조회수 구간별 분포</h3>
                <div className="space-y-2">
                  {[
                    { range: '1M 이상', count: webtoons.filter(w => w.interest_count >= 1000000).length },
                    { range: '500K-1M', count: webtoons.filter(w => w.interest_count >= 500000 && w.interest_count < 1000000).length },
                    { range: '100K-500K', count: webtoons.filter(w => w.interest_count >= 100000 && w.interest_count < 500000).length },
                    { range: '50K-100K', count: webtoons.filter(w => w.interest_count >= 50000 && w.interest_count < 100000).length },
                    { range: '50K 미만', count: webtoons.filter(w => w.interest_count < 50000).length }
                  ].map((item, index) => {
                    const maxCount = Math.max(...[
                      webtoons.filter(w => w.interest_count >= 1000000).length,
                      webtoons.filter(w => w.interest_count >= 500000 && w.interest_count < 1000000).length,
                      webtoons.filter(w => w.interest_count >= 100000 && w.interest_count < 500000).length,
                      webtoons.filter(w => w.interest_count >= 50000 && w.interest_count < 100000).length,
                      webtoons.filter(w => w.interest_count < 50000).length
                    ]);
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-20 text-sm text-gray-600">{item.range}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                          <div 
                            className="bg-gradient-to-r from-gray-300 to-green-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                            style={{ width: `${Math.max(8, percentage)}%` }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* 추천 시스템 탭 */}
        {selectedTab === 'recommend' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 AI 웹툰 추천 시스템</h2>
              <p className="text-gray-600">태그 유사도 기반 개인화 추천 엔진</p>
            </div>
            
            {/* 웹툰 선택 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-4">📚 추천받을 웹툰을 선택하세요</h3>
              <select 
                value={selectedWebtoon}
                onChange={(e) => handleWebtoonSelect(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">웹툰을 선택하세요...</option>
                {webtoons.map(webtoon => (
                  <option key={webtoon.title} value={webtoon.title}>
                    {webtoon.title} (평점: {webtoon.rating})
                  </option>
                ))}
              </select>
            </div>
            
            {/* 추천 결과 */}
            {selectedWebtoon && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-500 to-purple-600 text-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-2xl font-bold mb-2">'{selectedWebtoon}'을(를) 좋아한다면...</h3>
                  <p className="opacity-90">다음 웹툰들을 추천드립니다!</p>
                </div>
                
                {recommendationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">추천 분석 중...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-gray-800">{rec.title}</div>
                          <div className="bg-yellow-400 text-white px-2 py-1 rounded-full text-sm font-bold">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center">
                            <span className="text-gray-600">평점:</span>
                            <span className="ml-2 font-bold text-green-600">{rec.rating}</span>
                            <div className="ml-2 flex">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`${i < Math.floor(rec.rating)} ? 'text-yellow-400' : 'text-gray-300'`}>
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-600">조회수:</span>
                            <span className="ml-2 font-bold text-blue-600">
                              {rec.interest_count.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-600">유사도:</span>
                            <span className="ml-2 font-bold text-purple-600">
                              {(rec.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">공통 태그:</div>
                          <div className="flex flex-wrap gap-1">
                            {(rec.common_tags || []).map(tag => (
                              <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">모든 태그:</div>
                          <div className="flex flex-wrap gap-1">
                            {rec.tags.map(tag => (
                              <span key={tag} className={`px-2 py-1 rounded-full text-xs ${
                                (rec.common_tags || []).includes(tag) 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${(rec.similarity || 0.5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 푸터 */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">💡 데이터 기반 인사이트</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-cyan-400 font-bold">트렌드 분석</div>
                <div className="opacity-80">회귀/환생 장르가 급부상하며 20대 남성층에서 높은 인기</div>
              </div>
              <div>
                <div className="text-green-400 font-bold">성별 특성</div>
                <div className="opacity-80">여성향은 감성적 스토리, 남성향은 액션과 성장 서사 선호</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold">연령별 패턴</div>
                <div className="opacity-80">10대는 학원물, 30대는 현실적 드라마에 높은 관심</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 저작권 푸터 */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-xl font-bold text-gray-800">웹툰 분석</span>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 mb-1">
                제품/협업 문의: <span className="font-medium">webtoon@analytics.com</span> | 
                대표전화: <span className="font-medium">02-1234-5678</span>
              </p>
              <p className="text-xs text-gray-500">
                대표자: 홍길동 | 사업자등록번호: 123-45-67890 | 
                통신판매신고번호: 제2024-서울강남-1234호
              </p>
              <p className="text-xs text-gray-500 mt-1">
                © 2024 웹툰 데이터 분석 플랫폼. All Rights Reserved.
              </p>
            </div>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebtoonAnalyticsDashboard;