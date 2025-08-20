// NetworkVisualization.js - 기존 App.js와 통합 가능한 컴포넌트
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

console.log('NetworkVisualization - d3 import 성공:', d3);
console.log('NetworkVisualization - d3.select 함수 사용 가능:', typeof d3.select);

const NetworkVisualization = ({ 
  analysisData = null, 
  width = 800, 
  height = 600, 
  className = "",
  onTagSelect = null 
}) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [showControls, setShowControls] = useState(true);
  const [networkData, setNetworkData] = useState(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  // 테마 색상 팔레트 (녹색 계열)
  const colorScale = d3.scaleOrdinal()
    .domain(['장르', '테마', '설정', '스타일', '기타'])
    .range(['#16a34a', '#059669', '#047857', '#065f46', '#064e3b']);

  // 인기 한국어 태그 목록
  const popularTags = [
    '로맨스', '액션', '판타지', '드라마', '회귀', '성장', '학원', 
    '무협', '일상', '귀족', '복수', '현실', '코미디', '스릴러', '게임'
  ];

  // 분류 태그 카테고리 - 사용자 제공 분류 사용
  const tagCategories = {
    '장르': ['로맨스', '액션', '판타지', '드라마', '스릴러', '호러', '코미디', '일상', '무협'],
    '테마': ['회귀', '성장', '복수', '학원', '현실', '게임', '모험', '요리', '스포츠'],
    '설정': ['서양', '귀족', '현대', '미래', '과거', '농구']
  };

  // 네트워크 데이터 생성 (백엔드 API 형식 또는 분석 데이터 기반)
  const generateNetworkFromAnalysis = (analysis) => {
    console.log('NetworkVisualization - 받은 전체 데이터:', analysis);
    
    // 백엔드 API 형식 처리 (data.nodes와 data.links가 있는 경우)
    if (analysis && analysis.data && analysis.data.nodes && analysis.data.links) {
      console.log('NetworkVisualization - 백엔드 API data 형식 데이터 사용');
      const { nodes, links, summary } = analysis.data;
      return {
        nodes: nodes.map(node => ({
          ...node,
          selected: selectedTags.includes(node.id)
        })),
        links: links,
        summary: summary || {
          total_nodes: nodes.length,
          total_links: links.length,
          selected_tags: selectedTags,
          max_correlation: Math.max(...links.map(l => l.value), 0),
          avg_correlation: links.length > 0 ? links.reduce((sum, l) => sum + l.value, 0) / links.length : 0
        }
      };
    }
    
    // 직접 nodes와 links가 있는 경우 (이미 추출된 data)
    if (analysis && analysis.nodes && analysis.links) {
      console.log('NetworkVisualization - 직접 nodes/links 형식 데이터 사용');
      return {
        nodes: analysis.nodes.map(node => ({
          ...node,
          selected: selectedTags.includes(node.id)
        })),
        links: analysis.links,
        summary: analysis.summary || {
          total_nodes: analysis.nodes.length,
          total_links: analysis.links.length,
          selected_tags: selectedTags,
          max_correlation: Math.max(...analysis.links.map(l => l.value), 0),
          avg_correlation: analysis.links.length > 0 ? analysis.links.reduce((sum, l) => sum + l.value, 0) / analysis.links.length : 0
        }
      };
    }
    
    // 기존 tag_frequency 형식 처리 (fallback 데이터)
    if (analysis && analysis.tag_frequency) {
      console.log('NetworkVisualization - tag_frequency 형식 데이터 사용');
      const nodes = analysis.tag_frequency.slice(0, 15).map(([tag, count], index) => ({
        id: tag,
        count: count,
        influence: Math.max(0.3, 1 - (index * 0.05)),
        size: Math.min(Math.max(count * 2, 15), 35),
        group: getKoreanTagCategory(tag),
        selected: selectedTags.includes(tag),
        avg_rating: 9.0 + Math.random() * 0.8
      }));

      // 링크 생성 (태그 간 가상 연관성)
      const links = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < Math.min(nodes.length, i + 4); j++) {
          const correlation = Math.random() * 0.6 + 0.3;
          if (correlation > 0.4) {
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: correlation,
              width: Math.max(1, correlation * 6),
              co_occurrence: Math.floor(correlation * nodes[i].count * 0.5)
            });
          }
        }
      }

      return {
        nodes,
        links: links.slice(0, 20),
        summary: {
          total_nodes: nodes.length,
          total_links: links.length,
          selected_tags: selectedTags,
          max_correlation: Math.max(...links.map(l => l.value), 0),
          avg_correlation: links.length > 0 ? links.reduce((sum, l) => sum + l.value, 0) / links.length : 0
        }
      };
    }
    
    console.log('NetworkVisualization - 유효한 데이터가 없음');
    return null;
  };

  // 백엔드와 동일한 한국어 태그 카테고리 분류
  const getKoreanTagCategory = (tag) => {
    const categories = {
      '장르': ['로맨스', '액션', '판타지', '드라마', '스릴러', '호러', '코미디', '일상', '무협'],
      '테마': ['회귀', '성장', '복수', '학원', '현실', '게임', '모험', '요리', '스포츠'],
      '스타일': ['명작', '단편', '러블리'],
      '설정': ['서양', '귀족', '현대', '미래', '과거', '농구']
    };
    
    for (const [category, tags] of Object.entries(categories)) {
      if (tags.some(keyword => tag.includes(keyword))) {
        return category;
      }
    }
    return '기타';
  };

  // analysisData가 변경될 때 네트워크 데이터 생성
  useEffect(() => {
    if (analysisData) {
      const generated = generateNetworkFromAnalysis(analysisData);
      console.log('NetworkVisualization - 생성된 네트워크 데이터:', generated);
      setNetworkData(generated);
    }
  }, [analysisData, selectedTags]);

  const handleTagSelect = useCallback((tag) => {
    console.log('NetworkVisualization - 태그 클릭됨:', tag);
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    console.log('NetworkVisualization - 새로운 선택된 태그들:', newSelectedTags);
    setSelectedTags(newSelectedTags);
    
    // 부모 컴포넌트에 태그 선택 알림
    if (onTagSelect) {
      console.log('NetworkVisualization - onTagSelect 콜백 호출');
      onTagSelect(tag, newSelectedTags);
    } else {
      console.log('NetworkVisualization - onTagSelect 콜백이 없음');
    }
  }, [selectedTags, setSelectedTags, onTagSelect]);

  const focusOnCategory = (categoryTags) => {
    setSelectedTags(categoryTags);
  };

  const resetNetwork = () => {
    setSelectedTags([]);
  };

  const renderNetwork = useCallback(() => {
    console.log('NetworkVisualization - renderNetwork 함수 시작');
    console.log('NetworkVisualization - svgRef.current:', svgRef.current);
    
    let svg;
    try {
      svg = d3.select(svgRef.current);
      console.log('NetworkVisualization - d3.select 성공:', svg);
      svg.selectAll("*").remove();
      console.log('NetworkVisualization - svg 초기화 완료');
    } catch (error) {
      console.error('NetworkVisualization - d3.select 오류:', error);
      return;
    }
    
    if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
      // 데이터가 없을 때
      console.log('NetworkVisualization - 네트워크 데이터 없음, 기본 메시지 표시');
      svg.attr("width", width).attr("height", height);
      
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "#6b7280")
        .text("네트워크 데이터를 불러오는 중...");
      return;
    }

    svg.attr("width", width).attr("height", height);
    const g = svg.append("g");
    
    // 줌 기능
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // 노드와 링크 데이터를 d3가 이해할 수 있도록 복사
    const nodesCopy = networkData.nodes.map(d => ({...d}));
    const linksCopy = networkData.links.map(d => ({...d}));
    
    console.log('NetworkVisualization - 시뮬레이션 노드:', nodesCopy);
    console.log('NetworkVisualization - 시뮬레이션 링크:', linksCopy);
    
    // 시뮬레이션 설정
    const simulation = d3.forceSimulation(nodesCopy)
      .force("link", d3.forceLink(linksCopy)
        .id(d => d.id)
        .distance(d => 100 - (d.value * 30))
        .strength(d => d.value * 0.8))
      .force("charge", d3.forceManyBody()
        .strength(d => -200 - (d.influence * 100)))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide()
        .radius(d => d.size + 8));
    
    simulationRef.current = simulation;
    
    // 링크 그리기
    const links = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(linksCopy)
      .enter().append("line")
      .attr("stroke", "#6b7280")
      .attr("stroke-opacity", d => 0.2 + (d.value * 0.3))
      .attr("stroke-width", d => Math.max(1, d.width * 0.8))
      .attr("stroke-linecap", "round");
    
    // 노드 그룹
    const nodeGroups = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodesCopy)
      .enter().append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // 노드 그림자
    nodeGroups.append("circle")
      .attr("r", d => d.size + 3)
      .attr("fill", "rgba(0,0,0,0.1)")
      .attr("cx", 2)
      .attr("cy", 2);
    
    // 메인 노드
    const nodes = nodeGroups.append("circle")
      .attr("r", d => Math.min(d.size, 25))
      .attr("fill", d => {
        const baseColor = colorScale(d.group);
        return selectedTags.includes(d.id) ? baseColor : d3.interpolate(baseColor, "#ffffff")(0.2);
      })
      .attr("stroke", d => selectedTags.includes(d.id) ? "#ef4444" : "#ffffff")
      .attr("stroke-width", d => selectedTags.includes(d.id) ? 4 : 2)
      .on("click", (event, d) => {
        event.stopPropagation();
        console.log('NetworkVisualization - d3 노드 클릭 이벤트:', d.id);
        handleTagSelect(d.id);
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr("r", Math.min(d.size * 1.15, 30))
          .attr("stroke-width", 4);
        
        // 연결된 링크 강조
        links
          .attr("stroke-opacity", link => 
            (link.source.id === d.id || link.target.id === d.id) ? 0.8 : 0.1)
          .attr("stroke-width", link => 
            (link.source.id === d.id || link.target.id === d.id) ? link.width * 1.5 : link.width * 0.5);
        
        showTooltip(event, d);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr("r", Math.min(d.size, 25))
          .attr("stroke-width", selectedTags.includes(d.id) ? 4 : 2);
        
        links
          .attr("stroke-opacity", link => 0.3 + (link.value * 0.4))
          .attr("stroke-width", link => link.width);
        
        hideTooltip();
      });
    
    // 노드 레이블 (밖에만 표시)
    nodeGroups.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", d => Math.min(d.size, 25) + 16)
      .attr("font-size", "12px")
      .attr("font-weight", "700")
      .attr("fill", "#1f2937")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
      .style("pointer-events", "none");
    
    // 영향력 표시 (간단한 원)
    nodeGroups.append("circle")
      .attr("r", d => Math.max(2, d.influence * 6))
      .attr("cx", d => d.size * 0.5)
      .attr("cy", d => -d.size * 0.5)
      .attr("fill", "#16a34a")
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
  }, [networkData, selectedTags, width, height, handleTagSelect]);

  useEffect(() => {
    console.log('NetworkVisualization - useEffect 호출됨');
    console.log('NetworkVisualization - networkData:', networkData);
    console.log('NetworkVisualization - svgRef.current:', svgRef.current);
    console.log('NetworkVisualization - d3 사용 가능:', typeof d3);
    
    if (networkData && svgRef.current) {
      console.log('NetworkVisualization - renderNetwork 호출 시도');
      renderNetwork();
    } else {
      console.log('NetworkVisualization - renderNetwork 호출 안함 - 조건 불충족');
    }
  }, [networkData, renderNetwork]);


  const showTooltip = (event, d) => {
    const tooltip = d3.select("body").append("div")
      .attr("class", "network-tooltip")
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
        <div>⭐ 평균평점: <strong style="color: #34d399;">${d.avg_rating.toFixed(1)}</strong></div>
        <div>💫 영향력: <strong style="color: #f59e0b;">${(d.influence * 100).toFixed(1)}%</strong></div>
        <div>📊 크기: <strong style="color: #a78bfa;">${d.size}</strong></div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #475569; font-size: 11px; color: #cbd5e1;">
        클릭하여 관련 태그 네트워크 보기
      </div>
    `)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 10) + "px");
  };

  const hideTooltip = () => {
    d3.selectAll(".network-tooltip").remove();
  };

  const getNetworkInsights = () => {
    if (!networkData || !networkData.nodes) return [];
    
    const insights = [];
    
    const centralTag = networkData.nodes.reduce((max, node) => 
      node.influence > (max?.influence || 0) ? node : max, null);
    if (centralTag) {
      insights.push(`🎯 "${centralTag.id}"가 가장 중심적인 태그입니다`);
    }
    
    if (networkData.links && networkData.links.length > 0) {
      const strongestLink = networkData.links.reduce((max, link) => 
        link.value > (max?.value || 0) ? link : max, null);
      if (strongestLink) {
        // source와 target이 문자열인 경우와 객체인 경우 모두 처리
        const sourceId = typeof strongestLink.source === 'string' ? strongestLink.source : strongestLink.source.id;
        const targetId = typeof strongestLink.target === 'string' ? strongestLink.target : strongestLink.target.id;
        insights.push(`🔗 "${sourceId}" ↔ "${targetId}" 연결이 가장 강합니다`);
      }
    }
    
    if (selectedTags.length > 0) {
      insights.push(`📊 현재 ${selectedTags.length}개 태그가 선택되었습니다`);
    }
    
    return insights;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 컨트롤 패널 */}
      <div className="bg-white shadow-lg rounded-2xl p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800">🕸️ 태그 네트워크 분석</h2>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              한국어 최적화
            </div>
          </div>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showControls ? '컨트롤 숨기기' : '컨트롤 보기'}
          </button>
        </div>
        
        {showControls && (
          <div className="space-y-4">
            {/* 선택된 태그 */}
            {selectedTags.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-semibold mb-2 text-red-800">🎯 선택된 태그</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-red-500 text-white rounded-full text-sm cursor-pointer hover:bg-red-600"
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 카테고리별 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(tagCategories).map(([category, tags]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-bold text-gray-800 mb-2">{category}</h4>
                  <button
                    onClick={() => focusOnCategory(tags)}
                    className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm mb-2"
                  >
                    전체 {category} 분석
                  </button>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagSelect(tag)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
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
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={resetNetwork}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                전체 보기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 네트워크 차트 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">태그 연관성 네트워크</h3>
          {networkData && (
            <div className="text-sm text-gray-600">
              노드: {networkData.summary?.total_nodes || 0}개 | 
              연결: {networkData.summary?.total_links || 0}개
            </div>
          )}
        </div>
        
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
          <svg ref={svgRef} className="w-full"></svg>
        </div>
        
        {/* 네트워크 인사이트 */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="font-bold text-gray-800 mb-2">🧠 네트워크 인사이트</h4>
          <div className="space-y-2">
            {getNetworkInsights().map((insight, index) => (
              <div key={index} className="text-sm text-gray-700">• {insight}</div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 <strong>사용법:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• 노드를 클릭하여 태그를 선택/해제하세요</li>
            <li>• 마우스 휠로 확대/축소, 드래그로 이동 가능합니다</li>
            <li>• 노드 크기는 웹툰 수를, 선의 두께는 연관성을 나타냅니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualization;