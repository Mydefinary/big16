import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const KoreanKeywordNetworkChart = () => {
  const [networkData, setNetworkData] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [analysisStats, setAnalysisStats] = useState(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  // 한국어 샘플 데이터 (실제 네트워크 패턴 반영)
  const sampleData = {
    nodes: [
      { id: '로맨스', count: 28, influence: 0.85, size: 45, group: '장르', selected: false, avg_rating: 9.65 },
      { id: '액션', count: 22, influence: 0.78, size: 38, group: '장르', selected: false, avg_rating: 9.45 },
      { id: '판타지', count: 20, influence: 0.72, size: 35, group: '장르', selected: false, avg_rating: 9.52 },
      { id: '드라마', count: 18, influence: 0.68, size: 32, group: '장르', selected: false, avg_rating: 9.38 },
      { id: '회귀', count: 15, influence: 0.65, size: 28, group: '테마', selected: false, avg_rating: 9.67 },
      { id: '성장', count: 16, influence: 0.62, size: 30, group: '테마', selected: false, avg_rating: 9.41 },
      { id: '학원', count: 14, influence: 0.58, size: 26, group: '테마', selected: false, avg_rating: 9.33 },
      { id: '무협', count: 12, influence: 0.55, size: 24, group: '장르', selected: false, avg_rating: 9.58 },
      { id: '일상', count: 13, influence: 0.52, size: 25, group: '장르', selected: false, avg_rating: 9.21 },
      { id: '귀족', count: 10, influence: 0.48, size: 22, group: '설정', selected: false, avg_rating: 9.72 },
      { id: '복수', count: 9, influence: 0.45, size: 20, group: '테마', selected: false, avg_rating: 9.51 },
      { id: '현실', count: 11, influence: 0.42, size: 23, group: '테마', selected: false, avg_rating: 9.15 },
      { id: '코미디', count: 8, influence: 0.38, size: 18, group: '장르', selected: false, avg_rating: 9.02 },
      { id: '스릴러', count: 7, influence: 0.35, size: 17, group: '장르', selected: false, avg_rating: 9.28 },
      { id: '게임', count: 6, influence: 0.32, size: 16, group: '테마', selected: false, avg_rating: 9.43 }
    ],
    links: [
      { source: '로맨스', target: '드라마', value: 0.82, width: 6, co_occurrence: 18.5 },
      { source: '로맨스', target: '학원', value: 0.76, width: 5, co_occurrence: 16.2 },
      { source: '로맨스', target: '귀족', value: 0.71, width: 5, co_occurrence: 14.8 },
      { source: '액션', target: '판타지', value: 0.85, width: 7, co_occurrence: 22.1 },
      { source: '액션', target: '성장', value: 0.79, width: 6, co_occurrence: 19.3 },
      { source: '액션', target: '회귀', value: 0.74, width: 5, co_occurrence: 17.6 },
      { source: '판타지', target: '회귀', value: 0.77, width: 6, co_occurrence: 18.9 },
      { source: '판타지', target: '성장', value: 0.68, width: 4, co_occurrence: 15.4 },
      { source: '회귀', target: '무협', value: 0.73, width: 5, co_occurrence: 16.7 },
      { source: '드라마', target: '현실', value: 0.69, width: 4, co_occurrence: 14.2 },
      { source: '드라마', target: '일상', value: 0.65, width: 4, co_occurrence: 13.1 },
      { source: '학원', target: '일상', value: 0.62, width: 3, co_occurrence: 11.8 },
      { source: '학원', target: '코미디', value: 0.58, width: 3, co_occurrence: 10.5 },
      { source: '성장', target: '무협', value: 0.66, width: 4, co_occurrence: 12.9 },
      { source: '복수', target: '귀족', value: 0.64, width: 4, co_occurrence: 12.3 },
      { source: '복수', target: '드라마', value: 0.61, width: 3, co_occurrence: 11.2 },
      { source: '게임', target: '판타지', value: 0.59, width: 3, co_occurrence: 10.7 },
      { source: '스릴러', target: '현실', value: 0.57, width: 3, co_occurrence: 9.8 }
    ],
    summary: {
      total_nodes: 15,
      total_links: 18,
      selected_tags: [],
      max_correlation: 0.85,
      avg_correlation: 0.68
    }
  };

  // 한국어 색상 팔레트 (조화로운 색상)
  const colorScale = d3.scaleOrdinal()
    .domain(['장르', '테마', '설정', '스타일', '기타'])
    .range(['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#ea580c']);

  // 인기 한국어 태그 목록
  const popularKoreanTags = [
    '로맨스', '액션', '판타지', '드라마', '회귀', '성장', '학원', '무협', 
    '일상', '귀족', '복수', '현실', '코미디', '스릴러', '게임'
  ];

  // 장르별 필터 카테고리
  const genreCategories = {
    '주요장르': ['로맨스', '액션', '판타지', '드라마'],
    '테마': ['회귀', '성장', '복수', '현실'],
    '설정': ['학원', '무협', '귀족', '게임']
  };

  useEffect(() => {
    setNetworkData(sampleData);
    setAllTags(popularKoreanTags);
    setAnalysisStats({
      total_unique_tags: 127,
      frequent_tags_count: 45,
      correlation_threshold: 0.2
    });
  }, []);

  useEffect(() => {
    if (networkData && svgRef.current) {
      renderKoreanNetwork();
    }
  }, [networkData, selectedTags]);

  const fetchNetworkData = async (tags = []) => {
    setLoading(true);
    try {
      // 실제 API 호출
      const response = await fetch(`/api/analysis/network?selected_tags=${tags.join(',')}&min_correlation=0.2&max_nodes=30`);
      const data = await response.json();
      
      if (data.success) {
        setNetworkData(data.data);
        setAnalysisStats(data.data.analysis_stats);
      } else {
        // 실패 시 샘플 데이터 사용
        setNetworkData(sampleData);
      }
    } catch (error) {
      console.error('네트워크 데이터 로딩 실패:', error);
      // 에러 시 샘플 데이터 사용
      setNetworkData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    fetchNetworkData(newSelectedTags);
  };

  const renderKoreanNetwork = () => {
    const svg = d3.select(svgRef.current);
    const width = 900;
    const height = 700;
    
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);
    
    const g = svg.append("g");
    
    // 줌 기능 설정
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // 배경 그라디언트 정의
    const defs = svg.append("defs");
    const gradient = defs.append("radialGradient")
      .attr("id", "backgroundGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#f8fafc");
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#e2e8f0");

    // 배경 적용
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#backgroundGradient)");
    
    // 시뮬레이션 설정 (한국어 네트워크에 최적화)
    const simulation = d3.forceSimulation(networkData.nodes)
      .force("link", d3.forceLink(networkData.links)
        .id(d => d.id)
        .distance(d => 120 - (d.value * 40)) // 상관관계가 높을수록 가까이
        .strength(d => d.value * 0.8))
      .force("charge", d3.forceManyBody()
        .strength(d => -300 - (d.influence * 200))) // 영향력이 클수록 더 큰 반발력
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide()
        .radius(d => d.size + 8))
      .force("radial", d3.forceRadial(200, width / 2, height / 2).strength(0.1));
    
    simulationRef.current = simulation;
    
    // 링크 그룹
    const linkGroup = g.append("g").attr("class", "links");
    
    // 링크 그리기 (그라디언트 효과)
    const links = linkGroup.selectAll("line")
      .data(networkData.links)
      .enter().append("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", d => 0.3 + (d.value * 0.4))
      .attr("stroke-width", d => d.width)
      .attr("stroke-linecap", "round");
    
    // 노드 그룹
    const nodeGroup = g.append("g").attr("class", "nodes");
    
    const nodeGroups = nodeGroup.selectAll("g")
      .data(networkData.nodes)
      .enter().append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // 노드 외곽 그림자
    nodeGroups.append("circle")
      .attr("r", d => d.size + 3)
      .attr("fill", "rgba(0,0,0,0.1)")
      .attr("cx", 2)
      .attr("cy", 2);
    
    // 메인 노드 원
    const nodes = nodeGroups.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => {
        const baseColor = colorScale(d.group);
        return selectedTags.includes(d.id) ? baseColor : d3.interpolate(baseColor, "#ffffff")(0.3);
      })
      .attr("stroke", d => selectedTags.includes(d.id) ? "#ef4444" : "#ffffff")
      .attr("stroke-width", d => selectedTags.includes(d.id) ? 4 : 2)
      .on("click", (event, d) => {
        event.stopPropagation();
        handleTagSelect(d.id);
      })
      .on("mouseover", function(event, d) {
        // 호버 효과
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d.size * 1.15)
          .attr("stroke-width", 4);
        
        // 연결된 링크 강조
        links
          .attr("stroke-opacity", link => 
            (link.source.id === d.id || link.target.id === d.id) ? 0.8 : 0.1)
          .attr("stroke-width", link => 
            (link.source.id === d.id || link.target.id === d.id) ? link.width * 1.5 : link.width * 0.5);
        
        showKoreanTooltip(event, d);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d.size)
          .attr("stroke-width", selectedTags.includes(d.id) ? 4 : 2);
        
        // 링크 원상복구
        links
          .attr("stroke-opacity", link => 0.3 + (link.value * 0.4))
          .attr("stroke-width", link => link.width);
        
        hideTooltip();
      });
    
    // 노드 내부 아이콘 (카테고리별)
    nodeGroups.append("text")
      .text(d => getKoreanCategoryIcon(d.group))
      .attr("text-anchor", "middle")
      .attr("dy", "-0.1em")
      .attr("font-size", d => Math.min(d.size / 2.5, 16))
      .attr("fill", "#ffffff")
      .style("pointer-events", "none");
    
    // 노드 텍스트 레이블
    const labels = nodeGroups.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", d => d.size + 18)
      .attr("font-size", d => Math.min(d.size / 2.2, 14))
      .attr("font-weight", "bold")
      .attr("fill", "#334155")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.5)
      .style("pointer-events", "none");
    
    // 영향력 표시 (작은 원)
    nodeGroups.append("circle")
      .attr("r", d => d.influence * 8)
      .attr("cx", d => d.size * 0.6)
      .attr("cy", d => -d.size * 0.6)
      .attr("fill", "#fbbf24")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("pointer-events", "none");
    
    // 시뮬레이션 업데이트
    simulation.on("tick", () => {
      links
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      nodeGroups
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // 드래그 함수들
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const getKoreanCategoryIcon = (category) => {
    const icons = {
      '장르': '🎭',
      '테마': '📖',
      '설정': '🏛️',
      '스타일': '🎨',
      '기타': '⭐'
    };
    return icons[category] || '⭐';
  };

  const showKoreanTooltip = (event, d) => {
    const tooltip = d3.select("body").append("div")
      .attr("class", "korean-network-tooltip")
      .style("position", "absolute")
      .style("background", "linear-gradient(135deg, #1e293b 0%, #334155 100%)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("max-width", "250px");
    
    tooltip.html(`
      <div style="border-bottom: 1px solid #475569; margin-bottom: 8px; padding-bottom: 6px;">
        <strong style="font-size: 16px; color: #fbbf24;">${d.id}</strong>
        <span style="background: ${colorScale(d.group)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${d.group}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div>📚 웹툰 수: <strong style="color: #60a5fa;">${d.count}개</strong></div>
        <div>⭐ 평균평점: <strong style="color: #34d399;">${d.avg_rating}</strong></div>
        <div>💫 영향력: <strong style="color: #f59e0b;">${(d.influence * 100).toFixed(1)}%</strong></div>
        <div>📊 크기: <strong style="color: #a78bfa;">${d.size}</strong></div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #475569; font-size: 11px; color: #cbd5e1;">
        ${d.id === '로맨스' ? '💕 여성 독자층 최고 인기 장르' :
          d.id === '액션' ? '⚔️ 남성 독자층 선호 1위' :
          d.id === '회귀' ? '🔄 최근 급부상 트렌드' :
          d.id === '판타지' ? '🧙‍♂️ 전 연령대 사랑받는 장르' :
          '클릭하여 관련 태그 네트워크 보기'}
      </div>
    `)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 10) + "px");
  };

  const hideTooltip = () => {
    d3.selectAll(".korean-network-tooltip").remove();
  };

  const resetNetwork = () => {
    setSelectedTags([]);
    fetchNetworkData([]);
  };

  const focusOnCategory = (categoryTags) => {
    setSelectedTags(categoryTags);
    fetchNetworkData(categoryTags);
  };

  const getNetworkInsights = () => {
    if (!networkData) return [];
    
    const insights = [];
    
    // 가장 중심적인 태그
    const centralTag = networkData.nodes.reduce((max, node) => 
      node.influence > (max?.influence || 0) ? node : max, null);
    if (centralTag) {
      insights.push(`🎯 "${centralTag.id}"가 가장 중심적인 태그입니다 (영향력: ${(centralTag.influence * 100).toFixed(1)}%)`);
    }
    
    // 가장 강한 연결
    const strongestLink = networkData.links.reduce((max, link) => 
      link.value > (max?.value || 0) ? link : max, null);
    if (strongestLink) {
      insights.push(`🔗 "${strongestLink.source}" ↔ "${strongestLink.target}" 연결이 가장 강합니다 (상관도: ${(strongestLink.value * 100).toFixed(1)}%)`);
    }
    
    // 선택된 태그 분석
    if (selectedTags.length > 0) {
      const selectedNodes = networkData.nodes.filter(n => selectedTags.includes(n.id));
      const avgRating = selectedNodes.reduce((sum, n) => sum + n.avg_rating, 0) / selectedNodes.length;
      insights.push(`📊 선택된 태그들의 평균 평점: ${avgRating.toFixed(2)}`);
    }
    
    return insights;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 한국어 컨트롤 패널 */}
      <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-3xl font-bold text-gray-800">🕸️ 웹툰 태그 네트워크 분석</h2>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              한국어 최적화
            </div>
          </div>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            {showControls ? '컨트롤 숨기기' : '컨트롤 보기'}
          </button>
        </div>
        
        {showControls && (
          <div className="space-y-6">
            {/* 선택된 태그 표시 */}
            {selectedTags.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-semibold mb-3 text-red-800 flex items-center">
                  <span className="mr-2">🎯</span>
                  선택된 태그 ({selectedTags.length}개)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium cursor-pointer hover:bg-red-600 transition-colors shadow-sm"
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 카테고리별 빠른 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(genreCategories).map(([category, tags]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">{category === '주요장르' ? '🎭' : category === '테마' ? '📖' : '🏛️'}</span>
                    {category}
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => focusOnCategory(tags)}
                      className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      전체 {category} 분석
                    </button>
                    <div className="flex flex-wrap gap-1">
                      {tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagSelect(tag)}
                          className={`px-2 py-1 rounded-md text-xs transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 인기 태그 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center">
                <span className="mr-2">🏆</span>
                인기 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 컨트롤 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetNetwork}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md"
              >
                전체 네트워크 보기
              </button>
              <button
                onClick={() => fetchNetworkData(selectedTags)}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                disabled={loading}
              >
                {loading ? '분석 중...' : '네트워크 새로고침'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 네트워크 차트 메인 */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-gray-800">태그 연관성 네트워크</h3>
              {networkData && (
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  노드: {networkData.summary?.total_nodes || 0}개 | 
                  연결: {networkData.summary?.total_links || 0}개
                </div>
              )}
            </div>
            
            {/* 범례 */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>장르</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>테마</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>설정</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>영향력</span>
              </div>
            </div>
          </div>
          
          {/* 분석 통계 */}
          {analysisStats && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-600 font-medium">전체 태그</div>
                <div className="text-blue-800 font-bold text-lg">{analysisStats.total_unique_tags}개</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-600 font-medium">분석 대상</div>
                <div className="text-green-800 font-bold text-lg">{analysisStats.frequent_tags_count}개</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-purple-600 font-medium">상관관계 임계값</div>
                <div className="text-purple-800 font-bold text-lg">{(analysisStats.correlation_threshold * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <div className="text-lg font-medium text-gray-700">한국어 태그 네트워크 분석 중...</div>
                  <div className="text-sm text-gray-500">태그 상관관계를 계산하고 있습니다</div>
                </div>
              </div>
            )}
            
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
              <svg ref={svgRef} className="w-full"></svg>
            </div>
          </div>
        </div>
      </div>

      {/* 네트워크 인사이트 */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            실시간 네트워크 인사이트
          </h4>
          <div className="space-y-3">
            {getNetworkInsights().map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-blue-500 text-sm font-bold">#{index + 1}</div>
                <div className="text-sm text-gray-700 leading-relaxed">{insight}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📈</span>
            네트워크 사용법 & 팁
          </h4>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 font-bold">💡</span>
              <span>태그를 클릭하면 관련된 태그들과의 네트워크가 강조됩니다</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 font-bold">🔍</span>
              <span>마우스 휠로 확대/축소, 드래그로 화면 이동이 가능합니다</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-500 font-bold">⚡</span>
              <span>노드 크기는 웹툰 수를, 선의 두께는 연관성을 나타냅니다</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-500 font-bold">🎯</span>
              <span>카테고리별 분석으로 특정 장르/테마의 트렌드를 파악하세요</span>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 분석 도구 */}
      {selectedTags.length > 1 && (
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🔗</span>
            다중 태그 조합 분석
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="font-bold mb-2">선택된 조합</div>
              <div>{selectedTags.join(' + ')}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="font-bold mb-2">예상 타겟층</div>
              <div>
                {selectedTags.includes('로맨스') && selectedTags.includes('학원') ? '여성 10-20대' :
                 selectedTags.includes('액션') && selectedTags.includes('판타지') ? '남성 20-30대' :
                 selectedTags.includes('회귀') && selectedTags.includes('무협') ? '남성 20-40대' :
                 '다양한 연령층'}
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="font-bold mb-2">시장 전망</div>
              <div>
                {selectedTags.includes('회귀') ? '급성장 트렌드' :
                 selectedTags.includes('로맨스') ? '안정적 인기' :
                 selectedTags.includes('액션') ? '지속적 수요' :
                 '틈새 시장'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KoreanKeywordNetworkChart;