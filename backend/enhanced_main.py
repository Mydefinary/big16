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
from sklearn.feature_extraction.text import TfidfVectorizer
import warnings
warnings.filterwarnings('ignore')

# 한국어 자연어 처리 (선택적 import) - 임시로 비활성화
try:
    # from konlpy.tag import Okt
    KONLPY_AVAILABLE = False
    print("Info: KoNLPy temporarily disabled for Java-free deployment.")
except ImportError:
    KONLPY_AVAILABLE = False
    print("Warning: KoNLPy not available. Using basic text processing.")

load_dotenv()

app = FastAPI(
    title="웹툰 분석 API - TF-IDF Enhanced",
    description="TF-IDF 기반 줄거리 분석이 추가된 웹툰 추천 시스템 API",
    version="2.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://webtoon-analytics-dashboard.vercel.app",
        "https://webtoon-analytics-dashboard-1flmwo7bk.vercel.app",
        "http://20.249.154.2",
        "http://20.249.113.18:9000",
        "*"
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
    summary: str
    tags: List[str]
    interest_count: int
    rating: float
    gender: str
    ages: str

class EnhancedRecommendationRequest(BaseModel):
    title: str
    limit: Optional[int] = 5
    use_tfidf: Optional[bool] = True
    tfidf_weight: Optional[float] = 0.4

class SummaryAnalysisRequest(BaseModel):
    text: str
    max_keywords: Optional[int] = 10

class TFIDFAnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    message: Optional[str] = None

# 기존 태그 정규화 매핑
TAG_NORMALIZATION = {
    "완결로맨스": "로맨스",
    "완결 로맨스": "로맨스", 
    "순정": "로맨스",
    "연애": "로맨스",
    "러브": "로맨스",
    "완결액션": "액션",
    "완결 액션": "액션",
    "배틀": "액션", 
    "격투": "액션",
    "전투": "액션",
    "완결판타지": "판타지",
    "완결 판타지": "판타지",
    "마법": "판타지",
    "환상": "판타지",
    "이세계": "판타지",
    "완결드라마": "드라마",
    "완결 드라마": "드라마",
    "멜로": "드라마",
    "감동": "드라마",
    "완결스릴러": "스릴러",
    "완결 스릴러": "스릴러",
    "서스펜스": "스릴러",
    "미스터리": "스릴러",
    "완결일상": "일상",
    "완결 일상": "일상",
    "힐링": "일상",
    "소소한": "일상",
    "성장물": "성장",
    "레벨업": "성장",
    "코미디": "개그",
    "완결 개그": "개그",
    "완결개그": "개그",
    "왕족/귀족": "귀족",
    "러블리": "일상",
    "명작": "명작",
    "완결무료":"기타",
}

# TF-IDF 분석 클래스
class KoreanTFIDFAnalyzer:
    def __init__(self):
        self.vectorizer = None
        self.tfidf_matrix = None
        self.feature_names = None
        # KoNLPy 사용 시도 (Java 필요)
        try:
            self.okt = Okt() if KONLPY_AVAILABLE else None
        except Exception as e:
            print(f"Warning: Failed to initialize KoNLPy Okt: {e}")
            self.okt = None
        
        # 한국어 불용어 리스트 (웹툰 도메인 특화)
        self.korean_stopwords = {
            # 기본 불용어
            '이', '가', '을', '를', '의', '에', '는', '은', '과', '와', '도', '만', '로', '으로',
            '이다', '하다', '되다', '있다', '없다', '그', '그것', '이것', '저것', '여기', '거기', '저기',
            '때문', '위해', '통해', '대해', '그리고', '하지만', '그러나', '따라서', '그래서',
            '또한', '또', '역시', '물론', '만약', '비록', '아직', '이미', '항상', '가장', '매우',
            '정말', '아주', '너무', '조금', '좀', '많이', '잘', '못', '안', '마다', '모든', '각',
            '수', '것', '때', '곳', '점', '면', '중', '후', '전', '동안', '사이', '뒤', '앞',
            # 웹툰/스토리 관련 일반적 불용어
            '줄거리', '이야기', '내용', '작품', '웹툰', '만화', '소설', '드라마', '영화',
            '주인공', '등장인물', '캐릭터', '인물', '사람', '남자', '여자', '소년', '소녀',
            '상황', '경우', '시간', '순간', '하루', '어느날', '그날', '오늘', '어제', '내일',
            '세상', '세계', '현실', '일상', '생활', '인생', '사랑', '관계', '친구', '가족',
            '문제', '일', '상태', '마음', '생각', '느낌', '기분', '감정', '표현', '말',
            '과연', '정말로', '다시', '계속', '여전히', '드디어', '결국', '마침내',
            '때로는', '가끔', '자주', '늘', '언제나', '처음', '마지막', '끝', '시작',
            '더욱','더해져','요소가','더해져','요소가 더해져','흥미롭다','더욱 흥미롭다','된다','없는','있을까','있는',
            '시작된다','되는데','자신의','어느','함께'
        }
    
    def preprocess_korean_text(self, text):
        """한국어 텍스트 전처리"""
        if not text or pd.isna(text):
            return ""
            
        # 기본 정리
        text = str(text).strip()
        text = re.sub(r'[^\w\s가-힣]', ' ', text)  # 특수문자 제거 (한글 보존)
        text = re.sub(r'\s+', ' ', text)  # 중복 공백 제거
        
        if self.okt:
            # KoNLPy를 사용한 형태소 분석
            try:
                morphs = self.okt.morphs(text, stem=True)
                # 불용어 제거 및 2글자 이상 단어만 선택
                filtered_words = [word for word in morphs 
                                if len(word) >= 2 and word not in self.korean_stopwords]
                return ' '.join(filtered_words)
            except Exception as e:
                print(f"KoNLPy 처리 중 오류: {e}")
                return text
        else:
            # 기본 처리: 불용어만 제거
            words = text.split()
            filtered_words = [word for word in words 
                            if len(word) >= 2 and word not in self.korean_stopwords]
            return ' '.join(filtered_words)
    
    def fit_transform(self, texts):
        """TF-IDF 벡터화 수행"""
        if not texts:
            return None, None
            
        # 전처리된 텍스트
        processed_texts = [self.preprocess_korean_text(text) for text in texts]
        
        # 빈 텍스트 필터링
        processed_texts = [text if text.strip() else "빈문서" for text in processed_texts]
        
        # TF-IDF 벡터라이저 설정
        self.vectorizer = TfidfVectorizer(
            max_features=1000,  # 최대 1000개 특성
            min_df=2,  # 최소 2개 문서에서 등장
            max_df=0.8,  # 전체 문서의 80% 이상에서 등장하는 단어 제외
            ngram_range=(1, 2),  # 1-gram과 2-gram 사용
            token_pattern=r'[가-힣]{2,}|[a-zA-Z]{2,}',  # 한글 또는 영어 2글자 이상
        )
        
        try:
            # TF-IDF 매트릭스 생성
            self.tfidf_matrix = self.vectorizer.fit_transform(processed_texts)
            self.feature_names = self.vectorizer.get_feature_names_out()
            
            print(f"✅ TF-IDF 분석 완료 - 문서 수: {len(texts)}, 특성 수: {len(self.feature_names)}")
            return self.tfidf_matrix, self.feature_names
            
        except Exception as e:
            print(f"❌ TF-IDF 분석 실패: {e}")
            return None, None
    
    def get_top_keywords(self, doc_index, top_k=10):
        """특정 문서의 상위 키워드 추출"""
        if self.tfidf_matrix is None or doc_index >= self.tfidf_matrix.shape[0]:
            return []
            
        # 해당 문서의 TF-IDF 점수
        doc_tfidf = self.tfidf_matrix[doc_index].toarray()[0]
        
        # 상위 키워드 인덱스
        top_indices = doc_tfidf.argsort()[-top_k:][::-1]
        
        # 키워드와 점수 반환
        keywords = []
        for idx in top_indices:
            if doc_tfidf[idx] > 0:
                keywords.append({
                    'keyword': self.feature_names[idx],
                    'score': float(doc_tfidf[idx]),
                    'rank': len(keywords) + 1
                })
        
        return keywords
    
    def get_document_similarity(self, doc1_idx, doc2_idx):
        """두 문서 간 코사인 유사도 계산"""
        if self.tfidf_matrix is None:
            return 0.0
            
        doc1_vector = self.tfidf_matrix[doc1_idx:doc1_idx+1]
        doc2_vector = self.tfidf_matrix[doc2_idx:doc2_idx+1]
        
        similarity = cosine_similarity(doc1_vector, doc2_vector)[0][0]
        return float(similarity)

# 글로벌 TF-IDF 분석기 인스턴스
tfidf_analyzer = KoreanTFIDFAnalyzer()

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
        webtoon['normalized_tags'] = list(set(webtoon['tags']))
    return webtoons_data

# 샘플 데이터 (줄거리 포함)
SAMPLE_WEBTOONS = [
    {
        "rank": 1, "title": "화산귀환", 
        "summary": "대 화산파 13대 제자. 천하삼대검수 매화검존 청명. 천하를 혼란에 빠뜨린 고금제일마 천마의 목을 치고 십만대산의 정상에서 영면. 백 년의 시간을 뛰어넘어 아이의 몸으로 다시 살아나다.",
        "tags": ["회귀", "무협", "액션", "명작"], 
        "interest_count": 1534623, "rating": 9.88, "gender": "남성", "ages": "20대"
    },
    {
        "rank": 2, "title": "신의 탑", 
        "summary": "신의 탑 꼭대기에는 모든 것이 있다고 한다. 탑에 들어가 시험을 통과하면서 위로 올라가는 이야기. 각 층마다 다른 시험과 강력한 적들이 기다리고 있다.",
        "tags": ["판타지", "액션", "성장"], 
        "interest_count": 1910544, "rating": 9.84, "gender": "남성", "ages": "20대"
    },
    {
        "rank": 3, "title": "외모지상주의", 
        "summary": "못생긴 외모 때문에 괴롭힘을 당하던 주인공이 어느 날 잘생긴 몸으로 바뀌면서 겪는 이야기. 외모에 따른 차별과 사회 문제를 다룬다.",
        "tags": ["드라마", "학원", "액션"], 
        "interest_count": 824399, "rating": 9.40, "gender": "남성", "ages": "10대"
    },
    {
        "rank": 4, "title": "마른 가지에 바람처럼", 
        "summary": "가난한 백작 가문의 딸이 정략결혼을 통해 공작가로 시집가면서 펼쳐지는 로맨스. 냉정한 공작과 따뜻한 마음을 가진 여주인공의 사랑 이야기.",
        "tags": ["로맨스", "귀족", "서양"], 
        "interest_count": 458809, "rating": 9.97, "gender": "여성", "ages": "10대"
    },
    {
        "rank": 5, "title": "엄마를 만나러 가는 길", 
        "summary": "폐가에서 발견된 아이 모리는 구조대에 의해 보호소에서 눈을 뜬다. 후원자에게 조건 없는 사랑을 받고 자라면서 엄마라는 존재를 알게 되고 엄마를 찾아 떠나는 모험.",
        "tags": ["판타지", "모험", "일상"], 
        "interest_count": 259146, "rating": 9.98, "gender": "여성", "ages": "10대"
    },
    {
        "rank": 6, "title": "재혼 황후", 
        "summary": "완벽한 황후였던 나비에는 황제의 일방적인 이혼 통보를 받는다. 하지만 그녀에게는 이미 새로운 계획이 있었다. 이웃 나라 황제와의 재혼을 통한 복수.",
        "tags": ["로맨스", "귀족", "서양", "복수"], 
        "interest_count": 892456, "rating": 9.75, "gender": "여성", "ages": "20대"
    },
    {
        "rank": 7, "title": "나 혼자만 레벨업", 
        "summary": "세계에 던전과 헌터가 나타난 지 10여 년. 성진우는 E급 헌터다. 어느 날 이중 던전에서 죽을 뻔한 순간, 시스템이 나타나며 레벨업을 할 수 있게 된다.",
        "tags": ["액션", "게임", "판타지", "성장"], 
        "interest_count": 2156789, "rating": 9.91, "gender": "남성", "ages": "20대"
    },
    {
        "rank": 8, "title": "여신강림", 
        "summary": "화장으로 완전히 다른 사람이 된 주인공의 학원 로맨스. 진짜 얼굴을 숨긴 채 인기를 얻지만, 진실이 밝혀질까 두려워한다.",
        "tags": ["로맨스", "학원", "일상", "코미디"], 
        "interest_count": 1345678, "rating": 9.62, "gender": "여성", "ages": "10대"
    },
    {
        "rank": 9, "title": "이태원 클라쓰", 
        "summary": "아버지의 죽음 이후 복수를 다짐한 주인공이 이태원에서 작은 술집을 시작으로 대기업에 맞서는 성장 스토리. 현실적인 사회 문제를 다룬다.",
        "tags": ["드라마", "현실", "성장"], 
        "interest_count": 987654, "rating": 9.55, "gender": "남성", "ages": "30대"
    },
    {
        "rank": 10, "title": "유미의 세포들", 
        "summary": "평범한 직장인 유미의 머릿속 세포들이 벌이는 이야기. 연애, 직장, 일상의 고민을 세포들의 시점에서 유쾌하게 그려낸다.",
        "tags": ["로맨스", "일상", "드라마"], 
        "interest_count": 756432, "rating": 9.33, "gender": "여성", "ages": "30대"
    },
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
    """웹툰 데이터 로드 및 TF-IDF 분석 수행"""
    webtoons_data = load_webtoon_data_from_csv_safe()
    
    # TF-IDF 분석 수행
    summaries = [w['summary'] for w in webtoons_data]
    tfidf_matrix, feature_names = tfidf_analyzer.fit_transform(summaries)
    
    if tfidf_matrix is not None:
        print(f"✅ TF-IDF 분석 완료: {len(webtoons_data)}개 웹툰, {len(feature_names)}개 특성")
    else:
        print("❌ TF-IDF 분석 실패")
    
    return webtoons_data

def calculate_enhanced_similarity(webtoon1_idx, webtoon2_idx, webtoons_data, tfidf_weight=0.4):
    """태그 + TF-IDF 기반 향상된 유사도 계산"""
    w1 = webtoons_data[webtoon1_idx]
    w2 = webtoons_data[webtoon2_idx]
    
    # 1. 태그 기반 Jaccard 유사도
    tags1 = set(w1['tags'])
    tags2 = set(w2['tags'])
    
    intersection = len(tags1 & tags2)
    union = len(tags1 | tags2)
    jaccard_similarity = intersection / union if union > 0 else 0
    
    # 2. TF-IDF 기반 줄거리 유사도
    tfidf_similarity = 0
    if tfidf_analyzer.tfidf_matrix is not None:
        tfidf_similarity = tfidf_analyzer.get_document_similarity(webtoon1_idx, webtoon2_idx)
    
    # 3. 평점/조회수 가중치
    rating_similarity = 1 - abs(w1['rating'] - w2['rating']) / 10
    popularity_factor = min(w2['interest_count'] / 1000000, 1.0)
    
    # 4. 최종 유사도 계산
    tag_weight = 1 - tfidf_weight
    final_similarity = (
        jaccard_similarity * tag_weight * 0.7 +
        tfidf_similarity * tfidf_weight +
        rating_similarity * 0.15 +
        popularity_factor * 0.15
    )
    
    return {
        'final_similarity': final_similarity,
        'jaccard_similarity': jaccard_similarity,
        'tfidf_similarity': tfidf_similarity,
        'rating_similarity': rating_similarity,
        'common_tags': list(tags1 & tags2)
    }

# API 엔드포인트들

@app.get("/webtoon-api/api/")
async def read_root():
    return {
        "message": "TF-IDF 기반 웹툰 분석 API 서버가 정상 작동 중입니다",
        "version": "2.0.0",
        "features": [
            "TF-IDF 줄거리 분석", 
            "하이브리드 추천 시스템", 
            "키워드 자동 추출",
            "한국어 자연어 처리"
        ],
        "endpoints": {
            "webtoons": "/webtoon-api/api/webtoons",
            "tfidf_analysis": "/webtoon-api/api/analysis/tfidf", 
            "summary_keywords": "/webtoon-api/api/analysis/summary-keywords",
            "enhanced_recommendations": "/webtoon-api/api/recommendations/enhanced",
            "similarity_analysis": "/webtoon-api/api/analysis/similarity",
            "related_tags": "/webtoon-api/api/analysis/related-tags/{tag}",
            "network_analysis": "/webtoon-api/api/analysis/network",
            "tag_connectivity": "/webtoon-api/api/analysis/tag-connectivity",
            "insights": "/webtoon-api/api/analysis/insights",
            "stats": "/webtoon-api/api/stats",
            "heatmap": "/webtoon-api/api/analysis/heatmap"
        }
    }

@app.get("/webtoon-api/api/webtoons")
async def get_webtoons():
    """모든 웹툰 데이터 반환"""
    try:
        data = load_webtoon_data()
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 로딩 실패: {str(e)}")

@app.get("/webtoon-api/api/analysis/tfidf")
async def get_tfidf_analysis():
    """TF-IDF 분석 결과 반환"""
    try:
        webtoons_data = load_webtoon_data()
        
        if tfidf_analyzer.tfidf_matrix is None:
            return {"success": False, "message": "TF-IDF 분석이 수행되지 않았습니다"}
        
        # 전체 코퍼스에서 상위 키워드 추출
        feature_names = tfidf_analyzer.feature_names
        tfidf_matrix = tfidf_analyzer.tfidf_matrix
        
        # 평균 TF-IDF 점수 계산
        mean_scores = np.mean(tfidf_matrix.toarray(), axis=0)
        top_indices = mean_scores.argsort()[-20:][::-1]
        
        global_keywords = []
        for idx in top_indices:
            if mean_scores[idx] > 0:
                global_keywords.append({
                    'keyword': feature_names[idx],
                    'avg_score': float(mean_scores[idx]),
                    'rank': len(global_keywords) + 1
                })
        
        # 각 웹툰별 상위 키워드 (샘플)
        webtoon_keywords = {}
        for i in range(min(5, len(webtoons_data))):  # 상위 5개만
            keywords = tfidf_analyzer.get_top_keywords(i, top_k=5)
            webtoon_keywords[webtoons_data[i]['title']] = keywords
        
        return {
            "success": True,
            "data": {
                "global_keywords": global_keywords,
                "webtoon_keywords": webtoon_keywords,
                "total_features": len(feature_names),
                "total_documents": len(webtoons_data),
                "analysis_method": "TF-IDF with Korean preprocessing"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TF-IDF 분석 실패: {str(e)}")

@app.post("/webtoon-api/api/analysis/summary-keywords")
async def extract_summary_keywords(request: SummaryAnalysisRequest):
    """줄거리 텍스트에서 키워드 추출"""
    try:
        if not request.text.strip():
            return {"success": False, "message": "빈 텍스트입니다"}
        
        # 임시 TF-IDF 분석
        temp_analyzer = KoreanTFIDFAnalyzer()
        processed_text = temp_analyzer.preprocess_korean_text(request.text)
        
        # 단일 문서 분석을 위해 기존 데이터와 함께 분석
        webtoons_data = load_webtoon_data()
        all_summaries = [w['summary'] for w in webtoons_data] + [request.text]
        
        tfidf_matrix, feature_names = temp_analyzer.fit_transform(all_summaries)
        
        if tfidf_matrix is None:
            return {"success": False, "message": "TF-IDF 분석 실패"}
        
        # 마지막 문서(입력 텍스트)의 키워드 추출
        keywords = temp_analyzer.get_top_keywords(len(all_summaries) - 1, request.max_keywords)
        
        return {
            "success": True,
            "data": {
                "original_text": request.text,
                "processed_text": processed_text,
                "keywords": keywords,
                "keyword_count": len(keywords)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"키워드 추출 실패: {str(e)}")

@app.post("/webtoon-api/api/recommendations")
async def get_recommendations(request: EnhancedRecommendationRequest):
    """기본 웹툰 추천 API"""
    return await get_enhanced_recommendations(request)

@app.post("/webtoon-api/api/recommendations/enhanced") 
async def get_enhanced_recommendations(request: EnhancedRecommendationRequest):
    """TF-IDF 기반 향상된 웹툰 추천"""
    try:
        webtoons_data = load_webtoon_data()
        
        target_webtoon = next((w for i, w in enumerate(webtoons_data) 
                              if w['title'] == request.title), None)
        if not target_webtoon:
            return {"success": False, "message": "웹툰을 찾을 수 없습니다."}
        
        target_idx = next(i for i, w in enumerate(webtoons_data) 
                         if w['title'] == request.title)
        
        recommendations = []
        
        for i, webtoon in enumerate(webtoons_data):
            if webtoon['title'] == request.title:
                continue
            
            if request.use_tfidf and tfidf_analyzer.tfidf_matrix is not None:
                # TF-IDF 포함 향상된 유사도
                similarity_data = calculate_enhanced_similarity(
                    target_idx, i, webtoons_data, request.tfidf_weight
                )
                
                # 줄거리 키워드 추출
                target_keywords = tfidf_analyzer.get_top_keywords(target_idx, 5)
                candidate_keywords = tfidf_analyzer.get_top_keywords(i, 5)
                
                recommendations.append({
                    **webtoon,
                    'similarity': similarity_data['final_similarity'],
                    'jaccard_similarity': similarity_data['jaccard_similarity'],
                    'tfidf_similarity': similarity_data['tfidf_similarity'], 
                    'rating_similarity': similarity_data['rating_similarity'],
                    'common_tags': similarity_data['common_tags'],
                    'target_keywords': [kw['keyword'] for kw in target_keywords],
                    'candidate_keywords': [kw['keyword'] for kw in candidate_keywords],
                    'analysis_method': 'hybrid_tfidf_tags'
                })
            else:
                # 기존 태그 기반 유사도만
                target_tags = set(target_webtoon['tags'])
                webtoon_tags = set(webtoon['tags'])
                
                intersection = len(target_tags & webtoon_tags)
                union = len(target_tags | webtoon_tags)
                jaccard_similarity = intersection / union if union > 0 else 0
                
                rating_weight = webtoon['rating'] / 10.0
                popularity_weight = min(webtoon['interest_count'] / 1000000, 1.0)
                
                final_similarity = jaccard_similarity * 0.7 + rating_weight * 0.2 + popularity_weight * 0.1
                
                recommendations.append({
                    **webtoon,
                    'similarity': final_similarity,
                    'jaccard_similarity': jaccard_similarity,
                    'tfidf_similarity': 0,
                    'common_tags': list(target_tags & webtoon_tags),
                    'analysis_method': 'tags_only'
                })
        
        recommendations.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {
            "success": True,
            "data": recommendations[:request.limit],
            "count": len(recommendations),
            "requested_title": request.title,
            "target_tags": target_webtoon['tags'],
            "algorithm": "enhanced_tfidf_hybrid" if request.use_tfidf else "traditional_tags",
            "tfidf_enabled": request.use_tfidf,
            "tfidf_weight": request.tfidf_weight if request.use_tfidf else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"향상된 추천 생성 실패: {str(e)}")

@app.get("/webtoon-api/api/analysis/similarity/{title1}/{title2}")
async def get_similarity_analysis(title1: str, title2: str):
    """두 웹툰 간 상세 유사도 분석"""
    try:
        webtoons_data = load_webtoon_data()
        
        webtoon1_idx = next((i for i, w in enumerate(webtoons_data) if w['title'] == title1), None)
        webtoon2_idx = next((i for i, w in enumerate(webtoons_data) if w['title'] == title2), None)
        
        if webtoon1_idx is None or webtoon2_idx is None:
            return {"success": False, "message": "웹툰을 찾을 수 없습니다."}
        
        webtoon1 = webtoons_data[webtoon1_idx]
        webtoon2 = webtoons_data[webtoon2_idx]
        
        # 상세 유사도 분석
        similarity_data = calculate_enhanced_similarity(webtoon1_idx, webtoon2_idx, webtoons_data)
        
        # 키워드 추출
        keywords1 = tfidf_analyzer.get_top_keywords(webtoon1_idx, 10) if tfidf_analyzer.tfidf_matrix is not None else []
        keywords2 = tfidf_analyzer.get_top_keywords(webtoon2_idx, 10) if tfidf_analyzer.tfidf_matrix is not None else []
        
        return {
            "success": True,
            "data": {
                "webtoon1": {
                    "title": webtoon1['title'],
                    "summary": webtoon1['summary'],
                    "tags": webtoon1['tags'],
                    "keywords": keywords1
                },
                "webtoon2": {
                    "title": webtoon2['title'], 
                    "summary": webtoon2['summary'],
                    "tags": webtoon2['tags'],
                    "keywords": keywords2
                },
                "similarity_analysis": similarity_data,
                "comparison": {
                    "common_tags": similarity_data['common_tags'],
                    "common_keywords": [kw for kw in [k['keyword'] for k in keywords1] 
                                      if kw in [k['keyword'] for k in keywords2]],
                    "rating_difference": abs(webtoon1['rating'] - webtoon2['rating']),
                    "popularity_ratio": webtoon2['interest_count'] / max(webtoon1['interest_count'], 1)
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"유사도 분석 실패: {str(e)}")

@app.get("/webtoon-api/api/analysis/tags")
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

@app.get("/webtoon-api/api/api/analysis/network")
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

@app.get("/webtoon-api/api/analysis/related-tags/{tag}")
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

@app.get("/webtoon-api/api/stats")
async def get_statistics():
    """전체 통계 반환"""
    try:
        webtoons_data = load_webtoon_data()
        
        total_webtoons = len(webtoons_data)
        avg_rating = np.mean([w['rating'] for w in webtoons_data])
        avg_interest = np.mean([w['interest_count'] for w in webtoons_data])
        
        all_tags = []
        for w in webtoons_data:
            all_tags.extend(w['tags'])
        unique_tags = len(set(all_tags))
        
        return {
            "success": True,
            "data": {
                "total_webtoons": total_webtoons,
                "avg_rating": round(avg_rating, 2),
                "avg_interest": int(avg_interest),
                "unique_tags": unique_tags,
                "tfidf_features": len(tfidf_analyzer.feature_names) if tfidf_analyzer.feature_names is not None else 0,
                "analysis_enhanced": tfidf_analyzer.tfidf_matrix is not None,
                "last_updated": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통계 계산 실패: {str(e)}")

def generate_heatmap_data(webtoons_data):
    """히트맵 데이터 생성 (한국어 장르)"""
    genres = ['로맨스', '액션', '판타지', '드라마', '일상','무협/사극','스릴러']
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

@app.get("/webtoon-api/api/analysis/heatmap")
async def get_heatmap_analysis():
    """히트맵 분석 데이터 반환 (한국어 개선)"""
    try:
        webtoons_data = load_webtoon_data()
        heatmap_data = generate_heatmap_data(webtoons_data)
        
        return {
            "success": True, 
            "data": heatmap_data,
            "metadata": {
                "genres": ['로맨스', '액션', '판타지', '드라마', '일상', '스릴러'],
                "demographics": ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대'],
                "total_combinations": len(heatmap_data)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"히트맵 분석 실패: {str(e)}")
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

@app.get("/webtoon-api/api/analysis/tag-connectivity")
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

@app.get("/webtoon-api/api/analysis/insights")
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


@app.get("/webtoon-api/api/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "features": [
            "tfidf_analysis", 
            "korean_nlp", 
            "hybrid_recommendations", 
            "keyword_extraction",
            "heatmap_analysis"
        ],
        "tfidf_ready": tfidf_analyzer.tfidf_matrix is not None,
        "konlpy_available": KONLPY_AVAILABLE
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("enhanced_main:app", host="0.0.0.0", port=port, reload=False)