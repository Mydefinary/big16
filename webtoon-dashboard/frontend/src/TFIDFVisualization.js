// src/TFIDFVisualization.js - TF-IDF 분석 결과 시각화 컴포넌트
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useTFIDFAnalysis, useKeywordExtraction, useTFIDFStats } from './hooks/useTFIDFData';

const TFIDFVisualization = () => {
  const { tfidfData, loading: tfidfLoading, error: tfidfError } = useTFIDFAnalysis();
  const { keywords, extractKeywords, loading: keywordLoading } = useKeywordExtraction();
  const { stats, loading: statsLoading } = useTFIDFStats();
  
  const [selectedText, setSelectedText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 샘플 텍스트들
  const sampleTexts = [
    "폐가에서 발견된 아이 모리는 구조대에 의해 보호소에서 눈을 뜬다. 후원자에게 조건 없는 사랑을 받고 자라면서 엄마라는 존재를 알게 되고 엄마를 찾아 떠나는 모험.",
    "대 화산파 13대 제자. 천하삼대검수 매화검존 청명. 천하를 혼란에 빠뜨린 고금제일마 천마의 목을 치고 십만대산의 정상에서 영면. 백 년의 시간을 뛰어넘어 아이의 몸으로 다시 살아나다.",
    "세계에 던전과 헌터가 나타난 지 10여 년. 성진우는 E급 헌터다. 어느 날 이중 던전에서 죽을 뻔한 순간, 시스템이 나타나며 레벨업을 할 수 있게 된다."
  ];

  const handleTextAnalysis = async () => {
    if (!selectedText.trim()) return;
    await extractKeywords(selectedText, 10);
  };

  // 키워드 중요도에 따른 색상 계산
  const getKeywordColor = (score, maxScore) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return '#dc2626'; // 빨강
    if (intensity > 0.6) return '#ea580c'; // 주황
    if (intensity > 0.4) return '#d97706'; // 노랑-주황
    if (intensity > 0.2) return '#16a34a'; // 초록
    return '#6b7280'; // 회색
  };

  return (
    <div className="w-full space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🔍 TF-IDF 줄거리 분석</h2>
        <p className="text-gray-600">
          웹툰 줄거리에서 중요한 키워드를 자동으로 추출하고 분석합니다
        </p>
        
        {/* 상태 표시 */}
        <div className="mt-4 flex justify-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            !tfidfLoading && !tfidfError ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            TF-IDF 엔진: {tfidfLoading ? '로딩중...' : tfidfError ? '오프라인' : '온라인'}
          </div>
          {stats && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              분석된 특성: {stats.tfidf_features.toLocaleString()}개
            </div>
          )}
        </div>
      </div>

      {/* 전체 키워드 분석 */}
      {tfidfData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            전체 웹툰 줄거리 키워드 순위
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 상위 키워드 차트 */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-700">상위 20개 키워드</h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={tfidfData.global_keywords.slice(0, 20).map(item => ({
                    ...item,
                    display_score: (item.avg_score * 100).toFixed(1)
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="keyword" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    label={{ value: 'TF-IDF 점수', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [`${value}%`, 'TF-IDF 점수']}
                    labelFormatter={(label) => `키워드: ${label}`}
                  />
                  <Bar 
                    dataKey="display_score" 
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 키워드 클라우드 스타일 */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-700">키워드 클라우드</h4>
              <div className="bg-gray-50 rounded-lg p-6 h-96 overflow-hidden relative">
                <div className="flex flex-wrap gap-2">
                  {tfidfData.global_keywords.slice(0, 30).map((item, index) => {
                    const maxScore = Math.max(...tfidfData.global_keywords.slice(0, 30).map(k => k.avg_score));
                    const size = 12 + (item.avg_score / maxScore) * 24; // 12px ~ 36px
                    const color = getKeywordColor(item.avg_score, maxScore);
                    
                    return (
                      <span
                        key={index}
                        className="inline-block font-bold transition-transform hover:scale-110 cursor-pointer"
                        style={{ 
                          fontSize: `${size}px`, 
                          color: color,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                        }}
                        title={`TF-IDF 점수: ${(item.avg_score * 100).toFixed(1)}%`}
                      >
                        {item.keyword}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 웹툰별 키워드 샘플 */}
          {tfidfData.webtoon_keywords && (
            <div className="mt-8">
              <h4 className="font-semibold mb-4 text-gray-700">웹툰별 특성 키워드 (샘플)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(tfidfData.webtoon_keywords).map(([title, webtoonKeywords]) => (
                  <div key={title} className="bg-gray-50 rounded-lg p-4 border">
                    <h5 className="font-bold text-gray-800 mb-2">{title}</h5>
                    <div className="space-y-1">
                      {webtoonKeywords.map((kw, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{kw.keyword}</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {(kw.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 실시간 키워드 추출 도구 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🛠️</span>
          실시간 키워드 추출 도구
        </h3>
        
        <div className="space-y-4">
          {/* 샘플 텍스트 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              샘플 텍스트 선택:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {sampleTexts.map((text, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedText(text)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedText === text 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm text-gray-600 font-medium mb-1">
                    샘플 {index + 1}
                  </div>
                  <div className="text-sm text-gray-800">
                    {text.substring(0, 100)}...
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 입력 영역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              또는 직접 입력:
            </label>
            <textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="분석할 웹툰 줄거리를 입력하세요..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* 분석 버튼 */}
          <button
            onClick={handleTextAnalysis}
            disabled={!selectedText.trim() || keywordLoading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {keywordLoading ? '키워드 추출 중...' : '키워드 추출 분석'}
          </button>

          {/* 키워드 추출 결과 */}
          {keywords && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">추출된 키워드</h4>
              
              {/* 키워드 리스트 */}
              <div className="space-y-2 mb-4">
                {keywords.keywords.map((kw, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {kw.rank}
                      </span>
                      <span className="font-medium text-gray-800">{kw.keyword}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {(kw.score * 100).toFixed(1)}%
                      </span>
                      <div 
                        className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                      >
                        <div 
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${(kw.score * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 분석 정보 */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>원본 텍스트: {keywords.original_text.length}자</div>
                <div>전처리 후: {keywords.processed_text.length}자</div>
                <div>추출된 키워드: {keywords.keyword_count}개</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 고급 분석 도구 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">⚙️</span>
            고급 TF-IDF 분석
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showAdvanced ? '숨기기' : '보기'}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 분석 통계 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">분석 통계</h4>
              {stats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 웹툰:</span>
                    <span className="font-medium">{stats.total_webtoons.toLocaleString()}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TF-IDF 특성:</span>
                    <span className="font-medium">{stats.tfidf_features.toLocaleString()}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">고유 태그:</span>
                    <span className="font-medium">{stats.unique_tags}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균 평점:</span>
                    <span className="font-medium">{stats.avg_rating}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 알고리즘 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">알고리즘 정보</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• TF-IDF 벡터화 사용</div>
                <div>• 한국어 형태소 분석 적용</div>
                <div>• 1-gram, 2-gram 결합</div>
                <div>• 불용어 자동 제거</div>
                <div>• 코사인 유사도 계산</div>
              </div>
            </div>

            {/* 성능 지표 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">성능 지표</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">처리 속도</span>
                    <span className="font-medium">빠름</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">정확도</span>
                    <span className="font-medium">높음</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-5/6"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">한국어 지원</span>
                    <span className="font-medium">완벽</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 로딩/에러 상태 */}
      {(tfidfLoading || statsLoading) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">TF-IDF 분석 데이터 로딩 중...</p>
        </div>
      )}

      {(tfidfError || (!tfidfLoading && !tfidfData)) && (
        <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">TF-IDF 분석 서비스 오프라인</h3>
          <p className="text-yellow-700">
            현재 TF-IDF 분석 서비스에 연결할 수 없습니다.<br/>
            기본 태그 분석 기능은 정상 작동합니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default TFIDFVisualization;