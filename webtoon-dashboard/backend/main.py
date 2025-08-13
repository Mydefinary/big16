from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import json
import os
from datetime import datetime
import uvicorn
from dotenv import load_dotenv
from pathlib import Path
import re
from collections import defaultdict, Counter
from itertools import combinations
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

load_dotenv()

app = FastAPI(
    title="웹툰 분석 API",
    description="웹툰 데이터 분석 및 추천 시스템 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://webtoon-analytics-dashboard.vercel.app",
        "https://webtoon-analytics-dashboard-1flmwo7bk.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
    ],
)

# 데이터 모델
class WebtoonData(BaseModel):
    rank: int
    title: str
    tags: List[str]
    interest_count: int
    rating: float
    gender: str
    ages: str

class RecommendationRequest(BaseModel):
    title: str
    limit: Optional[int] = 5

class NetworkAnalysisRequest(BaseModel):
    selected_tags: Optional[List[str]] = []
    min_cooccurrence: Optional[float] = 0.2
    max_nodes: Optional[int] = 30

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    message: Optional[str] = None

# 태그 정규화 매핑 (한국어 기반)
TAG_NORMALIZATION = {
    # 로맨스 관련
    "완결로맨스": "로맨스",
    "완결 로맨스": "로맨스", 
    "순정": "로맨스",
    "연애": "로맨스",
    "러브": "로맨스",
    "순정남": "로맨스",
    "첫사랑": "로맨스",
    "소꿉친구": "로맨스",
    "리얼로맨스":"로맨스",
    
    # 액션 관련
    "완결액션": "액션",
    "완결 액션": "액션",
    "배틀": "액션",
    "격투": "액션",
    "전투": "액션",
    "격투기": "액션",
    "학원액션": "액션",
    "무협":"액션",
    
    # 판타지 관련
    "완결판타지": "판타지",
    "완결 판타지": "판타지",
    "마법": "판타지",
    "환상": "판타지",
    "이세계": "판타지",
    "이능력": "판타지",
    
    # 드라마 관련
    "완결드라마": "드라마",
    "완결 드라마": "드라마",
    "멜로": "드라마",
    "감동": "드라마",
    "감성드라마": "드라마",
    "감성적인": "드라마",
    
    # 스릴러 관련
    "완결스릴러": "스릴러",
    "완결 스릴러": "스릴러",
    "서스펜스": "스릴러",
    "미스터리": "스릴러",
    
    # 일상 관련
    "완결일상": "일상",
    "완결 일상": "일상",
    "힐링": "일상",
    "소소한": "일상",
    
    # 성장/무협 관련
    "성장물": "성장",
    "레벨업": "성장",
    "무협/사극": "무협",
    "사극": "무협",
    
     # 개그
    "코미디": "개그",
    "완결 개그": "개그",
    "완결개그": "개그",

    # 기타
    "왕족/귀족": "귀족",
    "러블리": "일상",
    "명작": "명작",
    "완결무료":"기타",
}

def normalize_tag(tag):
    """태그 정규화"""
    if not tag:
        return tag
    
    tag = tag.strip()
    normalized = TAG_NORMALIZATION.get(tag, tag)
    return normalized

def normalize_tags_in_data(webtoons_data):
    """데이터의 모든 태그 정규화"""
    for webtoon in webtoons_data:
        webtoon['tags'] = [normalize_tag(tag) for tag in webtoon['tags']]
        webtoon['normalized_tags'] = list(set(webtoon['tags']))  # 중복 제거
    return webtoons_data

# 샘플 데이터 (한국어 태그로 업데이트)
SAMPLE_WEBTOONS = [
    {"rank": 1, "title": "화산귀환", "tags": ["회귀", "무협", "액션", "명작"], "interest_count": 1534623, "rating": 9.88, "gender": "남성", "ages": "20대"},
    {"rank": 2, "title": "신의 탑", "tags": ["판타지", "액션", "성장"], "interest_count": 1910544, "rating": 9.84, "gender": "남성", "ages": "20대"},
    {"rank": 3, "title": "외모지상주의", "tags": ["드라마", "학원", "액션"], "interest_count": 824399, "rating": 9.40, "gender": "남성", "ages": "10대"},
    {"rank": 4, "title": "마른 가지에 바람처럼", "tags": ["로맨스", "귀족", "서양"], "interest_count": 458809, "rating": 9.97, "gender": "여성", "ages": "10대"},
    {"rank": 5, "title": "엄마를 만나러 가는 길", "tags": ["판타지", "모험", "일상"], "interest_count": 259146, "rating": 9.98, "gender": "여성", "ages": "10대"},
    {"rank": 6, "title": "재혼 황후", "tags": ["로맨스", "귀족", "서양", "복수"], "interest_count": 892456, "rating": 9.75, "gender": "여성", "ages": "20대"},
    {"rank": 7, "title": "나 혼자만 레벨업", "tags": ["액션", "게임", "판타지", "성장"], "interest_count": 2156789, "rating": 9.91, "gender": "남성", "ages": "20대"},
    {"rank": 8, "title": "여신강림", "tags": ["로맨스", "학원", "일상", "코미디"], "interest_count": 1345678, "rating": 9.62, "gender": "여성", "ages": "10대"},
    {"rank": 9, "title": "이태원 클라쓰", "tags": ["드라마", "현실", "성장"], "interest_count": 987654, "rating": 9.55, "gender": "남성", "ages": "30대"},
    {"rank": 10, "title": "유미의 세포들", "tags": ["로맨스", "일상", "드라마"], "interest_count": 756432, "rating": 9.33, "gender": "여성", "ages": "30대"},
    {"rank": 11, "title": "전지적 독자 시점", "tags": ["회귀", "판타지", "액션", "성장"], "interest_count": 1823456, "rating": 9.92, "gender": "남성", "ages": "20대"},
    {"rank": 12, "title": "악역의 엔딩은 죽음뿐", "tags": ["로맨스", "회귀", "판타지", "귀족"], "interest_count": 734521, "rating": 9.78, "gender": "여성", "ages": "20대"},
    {"rank": 13, "title": "나의 수학선생", "tags": ["로맨스", "학원", "드라마", "일상"], "interest_count": 654321, "rating": 9.45, "gender": "여성", "ages": "20대"},
    {"rank": 14, "title": "대학원 탈출일지", "tags": ["일상", "코미디", "현실"], "interest_count": 543210, "rating": 9.23, "gender": "남성", "ages": "20대"},
    {"rank": 15, "title": "기기괴괴", "tags": ["스릴러", "호러", "단편"], "interest_count": 432109, "rating": 9.34, "gender": "남성", "ages": "20대"},
    {"rank": 16, "title": "윈드브레이커", "tags": ["액션", "학원", "성장"], "interest_count": 687234, "rating": 9.67, "gender": "남성", "ages": "10대"},
    {"rank": 17, "title": "참교육", "tags": ["액션", "학원", "현실"], "interest_count": 923145, "rating": 9.12, "gender": "남성", "ages": "20대"},
    {"rank": 18, "title": "하루만 네가 되고 싶어", "tags": ["로맨스", "일상", "드라마"], "interest_count": 445678, "rating": 9.56, "gender": "여성", "ages": "10대"},
    {"rank": 19, "title": "취사병", "tags": ["요리", "일상", "드라마"], "interest_count": 534219, "rating": 9.23, "gender": "남성", "ages": "30대"},
    {"rank": 20, "title": "프리드로우", "tags": ["농구", "스포츠", "성장"], "interest_count": 678912, "rating": 9.45, "gender": "남성", "ages": "20대"},
]

def parse_tags(tags_str):
    """태그 문자열을 리스트로 안전하게 파싱"""
    if pd.isna(tags_str):
        return []
    
    tags_str = str(tags_str).strip()
    
    if tags_str.startswith('[') and tags_str.endswith(']'):
        try:
            import ast
            return [normalize_tag(tag) for tag in ast.literal_eval(tags_str)]
        except:
            tags_str = tags_str[1:-1]
    
    tags = []
    for tag in tags_str.split(','):
        tag = tag.strip().strip("'\"")
        if tag:
            tags.append(normalize_tag(tag))
    
    return tags

def load_webtoon_data_from_csv_safe():
    """안전한 CSV 데이터 로드"""
    try:
        csv_path = Path(__file__).parent / "final_webtoon_clean.csv"
        
        if not csv_path.exists():
            print(f"CSV 파일을 찾을 수 없습니다: {csv_path}")
            return normalize_tags_in_data(SAMPLE_WEBTOONS)
        
        df = pd.read_csv(csv_path)
        print(f"CSV 파일에서 {len(df)}개 행을 읽었습니다.")
        
        webtoons_data = []
        for idx, row in df.iterrows():
            try:
                webtoon = {
                    "rank": int(row['rank']),
                    "title": str(row['title']),
                    "summary": str(row.get('summary', '')),
                    "tags": parse_tags(row['tags']),
                    "interest_count": int(row['interest_count']),
                    "rating": float(row['rating']),
                    "gender": str(row['gender']),
                    "ages": str(row['ages'])
                }
                webtoons_data.append(webtoon)
            except Exception as e:
                print(f"행 {idx} 처리 중 오류: {e}")
                continue
        
        print(f"성공적으로 {len(webtoons_data)}개의 웹툰 데이터를 로드했습니다.")
        return normalize_tags_in_data(webtoons_data)
        
    except Exception as e:
        print(f"CSV 로딩 중 오류 발생: {e}")
        return normalize_tags_in_data(SAMPLE_WEBTOONS)

def load_webtoon_data():
    """웹툰 데이터 로드"""
    return load_webtoon_data_from_csv_safe()

def create_tag_matrix(webtoons_data, min_count=3):
    """태그 동시 출현 매트릭스 생성 (Python 분석 코드 기반)"""
    print("🏷️ 태그 동시 출현 매트릭스 생성 중...")
    
    # 모든 태그 수집 및 빈도 계산
    all_tags = []
    for webtoon in webtoons_data:
        if isinstance(webtoon['tags'], list):
            all_tags.extend(webtoon['tags'])
    
    tag_counts = Counter(all_tags)
    
    # 최소 빈도 이상인 태그만 선택
    frequent_tags = [tag for tag, count in tag_counts.items() if count >= min_count]
    frequent_tags = sorted(frequent_tags, key=lambda x: tag_counts[x], reverse=True)
    
    print(f"📊 총 고유 태그: {len(tag_counts)}개")
    print(f"📊 분석 대상 태그 ({min_count}회 이상): {len(frequent_tags)}개")
    
    # 태그 동시 출현 매트릭스 생성
    tag_matrix = np.zeros((len(frequent_tags), len(frequent_tags)))
    tag_to_idx = {tag: idx for idx, tag in enumerate(frequent_tags)}
    
    for webtoon in webtoons_data:
        current_tags = [tag for tag in webtoon['tags'] if tag in tag_to_idx]
        
        # 동시 출현 기록 (가중치 적용)
        weight = (webtoon['rating'] / 10.0) * (1 + np.log10(webtoon['interest_count'] + 1) / 10)
        
        for tag in current_tags:
            tag_matrix[tag_to_idx[tag], tag_to_idx[tag]] += weight
        
        for tag1, tag2 in combinations(current_tags, 2):
            idx1, idx2 = tag_to_idx[tag1], tag_to_idx[tag2]
            tag_matrix[idx1, idx2] += weight
            tag_matrix[idx2, idx1] += weight
    
    return tag_matrix, frequent_tags, tag_counts

def calculate_tag_correlations(tag_matrix, frequent_tags):
    """태그 간 상관계수 계산 (Python 분석 코드 기반)"""
    print("🔗 태그 상관관계 계산 중...")
    
    # 대각선 요소를 0으로 설정
    np.fill_diagonal(tag_matrix, 0)
    
    # 코사인 유사도 계산
    correlation_matrix = cosine_similarity(tag_matrix)
    
    # 상관관계가 높은 태그 쌍 찾기
    correlations = []
    n_tags = len(frequent_tags)
    
    for i in range(n_tags):
        for j in range(i+1, n_tags):
            if correlation_matrix[i, j] > 0:
                correlations.append({
                    'tag1': frequent_tags[i],
                    'tag2': frequent_tags[j],
                    'correlation': correlation_matrix[i, j],
                    'co_occurrence': tag_matrix[i, j]
                })
    
    correlations = sorted(correlations, key=lambda x: x['correlation'], reverse=True)
    return correlation_matrix, correlations

def create_advanced_network_data(webtoons_data, selected_tags=None, min_correlation=0.2, max_nodes=30):
    """고급 네트워크 데이터 생성 (한국어 기반)"""
    print("🕸️ 고급 네트워크 그래프 생성 중...")
    
    # 태그 매트릭스 및 상관관계 계산
    tag_matrix, frequent_tags, tag_counts = create_tag_matrix(webtoons_data)
    _, correlations = calculate_tag_correlations(tag_matrix, frequent_tags)
    
    # 전체 태그 영향력 계산 (모든 경우에 필요)
    tag_influence = defaultdict(float)
    for tag in frequent_tags[:50]:
        frequency_score = tag_counts.get(tag, 0) / max(tag_counts.values())
        
        connection_score = 0
        for corr in correlations[:50]:
            if corr['tag1'] == tag or corr['tag2'] == tag:
                connection_score += corr['correlation']
        
        tag_influence[tag] = frequency_score * 0.6 + (connection_score / 10) * 0.4

    # 선택된 태그가 있으면 해당 태그와 연결된 노드들만 포함
    if selected_tags:
        relevant_tags = set(selected_tags)
        for corr in correlations:
            if corr['correlation'] >= min_correlation:
                if corr['tag1'] in selected_tags or corr['tag2'] in selected_tags:
                    relevant_tags.add(corr['tag1'])
                    relevant_tags.add(corr['tag2'])
        
        # 연결성이 높은 태그들 우선 선택
        tag_connections = defaultdict(float)
        for corr in correlations[:100]:
            if corr['correlation'] >= min_correlation:
                tag_connections[corr['tag1']] += corr['correlation']
                tag_connections[corr['tag2']] += corr['correlation']
        
        sorted_tags = sorted(
            [(tag, score) for tag, score in tag_connections.items() if tag in relevant_tags],
            key=lambda x: x[1], reverse=True
        )
        top_tags = set([tag for tag, _ in sorted_tags[:max_nodes]])
    else:
        # 전체 태그에서 상위 노드 선택
        sorted_tags = sorted(tag_influence.items(), key=lambda x: x[1], reverse=True)
        top_tags = set([tag for tag, _ in sorted_tags[:max_nodes]])
    
    # 노드 생성 (한국어 카테고리)
    nodes = []
    for tag in top_tags:
        count = tag_counts.get(tag, 0)
        
        # 태그별 웹툰의 평균 평점과 조회수 계산
        tag_webtoons = [w for w in webtoons_data if tag in w['tags']]
        avg_rating = np.mean([w['rating'] for w in tag_webtoons]) if tag_webtoons else 0
        avg_interest = np.mean([w['interest_count'] for w in tag_webtoons]) if tag_webtoons else 0
        
        # 영향력 점수 계산
        influence = tag_influence.get(tag, 0)
        
        nodes.append({
            'id': tag,
            'count': count,
            'influence': round(influence, 3),
            'avg_rating': round(avg_rating, 2),
            'avg_interest': int(avg_interest),
            'size': min(max(count * 2, 15), 60),
            'group': get_korean_tag_category(tag),
            'selected': tag in (selected_tags or [])
        })
    
    # 링크 생성
    links = []
    node_ids = set(node['id'] for node in nodes)
    
    for corr in correlations:
        if (corr['correlation'] >= min_correlation and 
            corr['tag1'] in node_ids and corr['tag2'] in node_ids):
            
            links.append({
                'source': corr['tag1'],
                'target': corr['tag2'],
                'value': round(corr['correlation'], 3),
                'co_occurrence': round(corr['co_occurrence'], 1),
                'width': min(max(corr['correlation'] * 10, 1), 8)
            })
    
    # 상관관계 순으로 정렬
    links.sort(key=lambda x: x['value'], reverse=True)
    
    return {
        'nodes': nodes,
        'links': links[:100],  # 상위 100개 링크만
        'summary': {
            'total_nodes': len(nodes),
            'total_links': len(links),
            'selected_tags': selected_tags or [],
            'max_correlation': max([l['value'] for l in links]) if links else 0,
            'avg_correlation': np.mean([l['value'] for l in links]) if links else 0
        },
        'analysis_stats': {
            'total_unique_tags': len(tag_counts),
            'frequent_tags_count': len(frequent_tags),
            'correlation_threshold': min_correlation
        }
    }

def get_korean_tag_category(tag):
    """한국어 태그 카테고리 분류"""
    categories = {
        '장르': ['로맨스', '액션', '판타지', '드라마', '스릴러', '호러', '코미디', '일상', '무협'],
        '테마': ['회귀', '성장', '복수', '학원', '현실', '게임', '모험', '요리', '스포츠'],
        '스타일': ['명작', '단편', '러블리'],
        '설정': ['서양', '귀족', '현대', '미래', '과거', '농구']
    }
    
    for category, tags in categories.items():
        if any(keyword in tag for keyword in tags):
            return category
    
    return '기타'

def get_related_tags_advanced(target_tag, webtoons_data, limit=10):
    """특정 태그와 관련된 태그들 찾기 (고급 버전)"""
    print(f"🔍 '{target_tag}' 태그 관련성 분석 중...")
    
    related_scores = defaultdict(float)
    target_webtoons = [w for w in webtoons_data if target_tag in w['tags']]
    
    for webtoon in target_webtoons:
        # 가중치: 평점과 조회수를 고려
        weight = (webtoon['rating'] / 10.0) * (1 + np.log10(webtoon['interest_count'] + 1) / 20)
        
        for tag in webtoon['tags']:
            if tag != target_tag:
                related_scores[tag] += weight
    
    # 정규화
    if related_scores:
        max_score = max(related_scores.values())
        for tag in related_scores:
            related_scores[tag] = related_scores[tag] / max_score
    
    sorted_related = sorted(related_scores.items(), key=lambda x: x[1], reverse=True)
    
    return [{
        'tag': tag,
        'score': round(score, 3),
        'count': sum(1 for w in target_webtoons if tag in w['tags']),
        'category': get_korean_tag_category(tag)
    } for tag, score in sorted_related[:limit]]

# API 엔드포인트들

@app.get("/")
async def read_root():
    return {
        "message": "웹툰 분석 API 서버가 정상 작동 중입니다",
        "version": "1.0.0",
        "features": ["한국어 태그 네트워크", "고급 상관관계 분석", "개선된 추천 시스템"],
        "endpoints": {
            "webtoons": "/api/webtoons",
            "tag_analysis": "/api/analysis/tags",
            "network_analysis": "/api/analysis/network",
            "tag_connectivity": "/api/analysis/tag-connectivity",
            "related_tags": "/api/analysis/related-tags/{tag}",
            "heatmap": "/api/analysis/heatmap",
            "recommendations": "/api/recommendations",
            "statistics": "/api/stats"
        }
    }

@app.get("/api/webtoons")
async def get_webtoons():
    """모든 웹툰 데이터 반환"""
    try:
        data = load_webtoon_data()
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 로딩 실패: {str(e)}")

@app.get("/api/analysis/tags")
async def get_tag_analysis():
    """태그 분석 데이터 반환 (한국어 기반)"""
    try:
        webtoons_data = load_webtoon_data()
        
        # 모든 태그 수집
        all_tags = []
        for webtoon in webtoons_data:
            all_tags.extend(webtoon['tags'])
        
        tag_frequency = Counter(all_tags).most_common(20)
        
        return {
            "success": True,
            "data": {
                "tag_frequency": tag_frequency,
                "total_tags": len(set(all_tags)),
                "normalization_applied": True,
                "korean_support": True
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"태그 분석 실패: {str(e)}")

@app.get("/api/analysis/network")
async def get_network_analysis(
    selected_tags: Optional[str] = Query(None, description="쉼표로 구분된 선택된 태그들"),
    min_correlation: Optional[float] = Query(0.2, description="최소 상관계수"),
    max_nodes: Optional[int] = Query(30, description="최대 노드 수")
):
    """고급 키워드 네트워크 분석 데이터 반환"""
    try:
        webtoons_data = load_webtoon_data()
        
        # 선택된 태그 파싱
        selected_tag_list = []
        if selected_tags:
            selected_tag_list = [tag.strip() for tag in selected_tags.split(',') if tag.strip()]
        
        network_data = create_advanced_network_data(
            webtoons_data, 
            selected_tag_list, 
            min_correlation, 
            max_nodes
        )
        
        return {"success": True, "data": network_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"네트워크 분석 실패: {str(e)}")

@app.get("/api/analysis/related-tags/{tag}")
async def get_related_tags_analysis(tag: str, limit: Optional[int] = Query(10)):
    """특정 태그와 관련된 태그들 반환 (고급 분석)"""
    try:
        webtoons_data = load_webtoon_data()
        
        # 태그 정규화
        normalized_tag = normalize_tag(tag)
        
        related_tags = get_related_tags_advanced(normalized_tag, webtoons_data, limit)
        
        return {
            "success": True,
            "data": {
                "target_tag": normalized_tag,
                "related_tags": related_tags,
                "count": len(related_tags),
                "analysis_method": "weighted_correlation"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"관련 태그 분석 실패: {str(e)}")

@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """개선된 추천 웹툰 반환"""
    try:
        webtoons_data = load_webtoon_data()
        
        target_webtoon = next((w for w in webtoons_data if w['title'] == request.title), None)
        if not target_webtoon:
            return {"success": False, "message": "웹툰을 찾을 수 없습니다."}
        
        target_tags = set(target_webtoon['tags'])
        recommendations = []
        
        for webtoon in webtoons_data:
            if webtoon['title'] == request.title:
                continue
                
            webtoon_tags = set(webtoon['tags'])
            
            # 개선된 유사도 계산 (Jaccard + 가중치)
            intersection = len(target_tags & webtoon_tags)
            union = len(target_tags | webtoon_tags)
            jaccard_similarity = intersection / union if union > 0 else 0
            
            # 평점과 조회수를 고려한 가중치
            rating_weight = webtoon['rating'] / 10.0
            popularity_weight = min(webtoon['interest_count'] / 1000000, 1.0)
            
            final_similarity = jaccard_similarity * 0.7 + rating_weight * 0.2 + popularity_weight * 0.1
            
            if final_similarity > 0:
                recommendations.append({
                    **webtoon,
                    'similarity': round(final_similarity, 3),
                    'jaccard_similarity': round(jaccard_similarity, 3),
                    'common_tags': list(target_tags & webtoon_tags),
                    'reason': f"공통 태그 {intersection}개, 유사도 {final_similarity:.1%}"
                })
        
        recommendations.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {
            "success": True, 
            "data": recommendations[:request.limit],
            "count": len(recommendations),
            "requested_title": request.title,
            "target_tags": list(target_tags),
            "algorithm": "enhanced_weighted_similarity"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"추천 생성 실패: {str(e)}")

@app.get("/api/stats")
async def get_statistics():
    """전체 통계 반환 (한국어 개선)"""
    try:
        webtoons_data = load_webtoon_data()
        
        total_webtoons = len(webtoons_data)
        avg_rating = np.mean([w['rating'] for w in webtoons_data])
        avg_interest = np.mean([w['interest_count'] for w in webtoons_data])
        
        # 정규화된 태그 통계
        all_tags = []
        for w in webtoons_data:
            all_tags.extend(w['tags'])
        unique_tags = len(set(all_tags))
        tag_frequency = Counter(all_tags)
        
        # 성별/연령별 분포
        gender_dist = defaultdict(int)
        age_dist = defaultdict(int)
        for w in webtoons_data:
            gender_dist[w['gender']] += 1
            age_dist[w['ages']] += 1
        
        # 장르별 분포
        genre_dist = defaultdict(int)
        main_genres = ['로맨스', '액션', '판타지', '드라마', '스릴러', '일상', '무협']
        for genre in main_genres:
            genre_dist[genre] = sum(1 for w in webtoons_data if genre in w['tags'])
        
        return {
            "success": True,
            "data": {
                "total_webtoons": total_webtoons,
                "avg_rating": round(avg_rating, 2),
                "avg_interest": int(avg_interest),
                "unique_tags": unique_tags,
                "gender_distribution": dict(gender_dist),
                "age_distribution": dict(age_dist),
                "genre_distribution": dict(genre_dist),
                "top_tags": tag_frequency.most_common(10),
                "normalization_stats": {
                    "normalized_mappings": len(TAG_NORMALIZATION),
                    "korean_tags_supported": True,
                    "example_normalizations": dict(list(TAG_NORMALIZATION.items())[:5])
                },
                "last_updated": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통계 계산 실패: {str(e)}")

def generate_heatmap_data(webtoons_data):
    """히트맵 데이터 생성 (한국어 장르)"""
    genres = ['로맨스', '액션', '판타지', '드라마', '무협', '일상', '스릴러']
    demographics = ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대']
    
    heatmap_data = []
    
    for demo_idx, demo in enumerate(demographics):
        gender, age = demo.split('-')
        for genre_idx, genre in enumerate(genres):
            count = sum(1 for w in webtoons_data 
                       if w['gender'] == gender and w['ages'] == age and genre in w['tags'])
            
            # 평균 평점도 계산
            genre_webtoons = [w for w in webtoons_data 
                            if w['gender'] == gender and w['ages'] == age and genre in w['tags']]
            avg_rating = np.mean([w['rating'] for w in genre_webtoons]) if genre_webtoons else 0
            
            heatmap_data.append({
                'x': genre_idx,
                'y': demo_idx,
                'value': count,
                'genre': genre,
                'demographic': demo,
                'count': count,
                'avg_rating': round(avg_rating, 2),
                'intensity': count / max(1, max([sum(1 for w in webtoons_data if g in w['tags']) for g in genres]))
            })
    
    return heatmap_data

@app.get("/api/analysis/heatmap")
async def get_heatmap_analysis():
    """히트맵 분석 데이터 반환 (한국어 개선)"""
    try:
        webtoons_data = load_webtoon_data()
        heatmap_data = generate_heatmap_data(webtoons_data)
        
        return {
            "success": True, 
            "data": heatmap_data,
            "metadata": {
                "genres": ['로맨스', '액션', '판타지', '드라마', '무협', '일상', '스릴러'],
                "demographics": ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대'],
                "total_combinations": len(heatmap_data)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"히트맵 분석 실패: {str(e)}")

def analyze_tag_connectivity(webtoons_data, min_correlation=0.15):
    """태그별 연결성 분석 - 각 태그가 몇 개의 다른 태그와 연결되어 있는지 분석"""
    print("🕸️ 태그 연결성 분석 시작...")
    
    # 태그 매트릭스 및 상관관계 계산
    tag_matrix, frequent_tags, tag_counts = create_tag_matrix(webtoons_data)
    _, correlations = calculate_tag_correlations(tag_matrix, frequent_tags)
    
    # 각 태그별 연결된 태그들과 연결 강도 계산
    tag_connections = {}
    
    for tag in frequent_tags:
        connected_tags = []
        
        # 이 태그와 연결된 모든 태그들 찾기
        for corr in correlations:
            if corr['correlation'] >= min_correlation:
                if corr['tag1'] == tag:
                    connected_tags.append({
                        'connected_tag': corr['tag2'],
                        'correlation': round(corr['correlation'], 3),
                        'co_occurrence': round(corr['co_occurrence'], 1)
                    })
                elif corr['tag2'] == tag:
                    connected_tags.append({
                        'connected_tag': corr['tag1'], 
                        'correlation': round(corr['correlation'], 3),
                        'co_occurrence': round(corr['co_occurrence'], 1)
                    })
        
        # 연결 강도순으로 정렬
        connected_tags.sort(key=lambda x: x['correlation'], reverse=True)
        
        tag_connections[tag] = {
            'tag': tag,
            'connection_count': len(connected_tags),
            'connected_tags': connected_tags,
            'frequency': tag_counts.get(tag, 0),
            'avg_correlation': round(np.mean([ct['correlation'] for ct in connected_tags]), 3) if connected_tags else 0,
            'category': get_korean_tag_category(tag)
        }
    
    # 연결성이 높은 순으로 정렬
    sorted_connectivity = sorted(
        tag_connections.values(),
        key=lambda x: (x['connection_count'], x['avg_correlation']),
        reverse=True
    )
    
    return sorted_connectivity

@app.get("/api/analysis/tag-connectivity")
async def get_tag_connectivity(
    min_correlation: Optional[float] = Query(0.15, description="최소 상관계수"),
    top_n: Optional[int] = Query(15, description="상위 N개 태그")
):
    """태그별 연결성 분석 - 각 태그가 몇 개의 다른 태그와 연결되어 있는지"""
    try:
        webtoons_data = load_webtoon_data()
        connectivity_data = analyze_tag_connectivity(webtoons_data, min_correlation)
        
        # 상위 N개만 선택
        top_connectivity = connectivity_data[:top_n]
        
        # 요약 통계
        summary = {
            "total_analyzed_tags": len(connectivity_data),
            "min_correlation_threshold": min_correlation,
            "most_connected_tag": connectivity_data[0]['tag'] if connectivity_data else None,
            "max_connections": connectivity_data[0]['connection_count'] if connectivity_data else 0,
            "avg_connections": round(np.mean([t['connection_count'] for t in connectivity_data]), 1) if connectivity_data else 0
        }
        
        return {
            "success": True,
            "data": {
                "top_connected_tags": top_connectivity,
                "summary": summary,
                "analysis_info": {
                    "description": "각 태그가 다른 태그들과 얼마나 강하게 연결되어 있는지 분석",
                    "correlation_method": "cosine_similarity",
                    "weight_factors": ["rating", "interest_count"],
                    "min_tag_frequency": 3
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"태그 연결성 분석 실패: {str(e)}")

@app.get("/api/analysis/insights")
async def get_insights():
    """데이터 기반 인사이트 제공"""
    try:
        webtoons_data = load_webtoon_data()
        
        # 태그 트렌드 분석
        all_tags = []
        for w in webtoons_data:
            all_tags.extend(w['tags'])
        tag_frequency = Counter(all_tags)
        
        # 성별별 선호 태그
        male_tags = []
        female_tags = []
        for w in webtoons_data:
            if w['gender'] == '남성':
                male_tags.extend(w['tags'])
            else:
                female_tags.extend(w['tags'])
        
        male_preferences = Counter(male_tags).most_common(10)
        female_preferences = Counter(female_tags).most_common(10)
        
        # 고평점 태그 분석
        high_rated_tags = defaultdict(list)
        for w in webtoons_data:
            if w['rating'] >= 9.5:
                for tag in w['tags']:
                    high_rated_tags[tag].append(w['rating'])
        
        quality_tags = {
            tag: round(np.mean(ratings), 2) 
            for tag, ratings in high_rated_tags.items() 
            if len(ratings) >= 3
        }
        quality_tags = sorted(quality_tags.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "success": True,
            "data": {
                "trending_tags": tag_frequency.most_common(10),
                "male_preferences": male_preferences,
                "female_preferences": female_preferences,
                "quality_indicators": quality_tags,
                "insights": {
                    "most_popular_genre": tag_frequency.most_common(1)[0][0],
                    "gender_difference": len(set(dict(male_preferences[:5]).keys()) - set(dict(female_preferences[:5]).keys())),
                    "quality_vs_popularity": "평점과 인기도의 상관관계 분석 결과"
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인사이트 분석 실패: {str(e)}")

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "features": ["korean_tags", "advanced_network", "weighted_similarity"]
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)