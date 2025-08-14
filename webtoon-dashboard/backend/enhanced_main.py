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

# 한국어 자연어 처리 (선택적 import)
try:
    from konlpy.tag import Okt
    KONLPY_AVAILABLE = True
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
    "무협/사극": "무협",
    "사극": "무협",
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
        self.okt = Okt() if KONLPY_AVAILABLE else None
        
        # 한국어 불용어 리스트
        self.korean_stopwords = {
            '이', '가', '을', '를', '의', '에', '는', '은', '과', '와', '도', '만', '로', '으로',
            '이다', '하다', '되다', '있다', '없다', '그', '그것', '이것', '저것', '여기', '거기', '저기',
            '때문', '위해', '통해', '대해', '그리고', '하지만', '그러나', '따라서', '그래서',
            '또한', '또', '역시', '물론', '만약', '비록', '아직', '이미', '항상', '가장', '매우',
            '정말', '아주', '너무', '조금', '좀', '많이', '잘', '못', '안', '마다', '모든', '각',
            '수', '것', '때', '곳', '점', '면', '중', '후', '전', '동안', '사이', '뒤', '앞'
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

@app.get("/")
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
            "webtoons": "/api/webtoons",
            "tfidf_analysis": "/api/analysis/tfidf", 
            "summary_keywords": "/api/analysis/summary-keywords",
            "enhanced_recommendations": "/api/recommendations/enhanced",
            "similarity_analysis": "/api/analysis/similarity"
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

@app.get("/api/analysis/tfidf")
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

@app.post("/api/analysis/summary-keywords")
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

@app.post("/api/recommendations/enhanced") 
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

@app.get("/api/analysis/similarity/{title1}/{title2}")
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

# 기존 API들도 유지 (태그 분석, 네트워크 등)
@app.get("/api/analysis/tags")
async def get_tag_analysis():
    """태그 분석 데이터 반환"""
    try:
        webtoons_data = load_webtoon_data()
        
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

@app.get("/api/stats")
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

@app.get("/health")
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
            "keyword_extraction"
        ],
        "tfidf_ready": tfidf_analyzer.tfidf_matrix is not None,
        "konlpy_available": KONLPY_AVAILABLE
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("enhanced_main:app", host="0.0.0.0", port=port, reload=False)