import React, { useState, useRef } from "react";
import axios from "axios";
import NavBar from "./NavBar.tsx";

// 샘플 이미지 임포트
import sampleImage1 from "../assets/input_sample1.png";
import sampleImage2 from "../assets/input_sample2.jpg";
import outputSampleImage from "../assets/output_sample.png";

// 스타일 정의
const aspectRatios = [ "match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "4:5", "5:4", "21:9", "9:21", "2:1", "1:2" ];

const containerStyle: React.CSSProperties = { 
  fontFamily: "'Noto Sans KR', 'Nanum Gothic', sans-serif", 
  background: "linear-gradient(135deg, #09AA5C 0%, #067B45 100%)",
  minHeight: "100vh", 
  margin: 0, 
  padding: "20px", 
  overflowX: "hidden" 
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
  padding: "40px",
  maxWidth: "1200px",
  margin: "0 auto"
};

const titleStyle: React.CSSProperties = {
  fontSize: "2.5em",
  fontWeight: "bold",
  color: "#09AA5C",
  textAlign: "center",
  marginBottom: "10px"
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "1.2em",
  color: "#666",
  textAlign: "center",
  marginBottom: "40px"
};

const mainContentStyle: React.CSSProperties = { 
  display: "grid", 
  gridTemplateColumns: "1fr 1fr", 
  gap: "40px", 
  alignItems: "start",
  '@media (max-width: 768px)': {
    gridTemplateColumns: "1fr"
  }
};

const sectionStyle: React.CSSProperties = {
  background: "#f8f9fa",
  padding: "30px",
  borderRadius: "15px",
  border: "1px solid #e9ecef"
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "25px"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "bold",
  marginBottom: "8px",
  color: "#495057",
  fontSize: "16px"
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #dee2e6',
  borderRadius: '8px',
  fontSize: '16px',
  transition: 'border-color 0.3s, box-shadow 0.3s',
  boxSizing: 'border-box'
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '120px',
  resize: 'vertical',
  fontFamily: 'inherit'
};

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
};

const imagePreviewStyle: React.CSSProperties = {
  border: "2px dashed #dee2e6",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "12px",
  backgroundColor: "#ffffff",
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: "250px",
  color: "#6c757d",
  fontSize: "14px",
  transition: "border-color 0.3s"
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 24px',
  background: 'linear-gradient(135deg, #09AA5C 0%, #067B45 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.3s',
  marginTop: '10px'
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#6c757d',
  width: 'auto',
  padding: '10px 20px',
  fontSize: '14px',
  marginTop: '10px',
  marginBottom: '10px'
};

const progressStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: '#e9ecef',
  borderRadius: '4px',
  overflow: 'hidden',
  marginTop: '15px'
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #09AA5C, #067B45)',
  borderRadius: '4px',
  transition: 'width 0.3s ease'
};

const alertStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '14px',
  fontWeight: '500'
};

const errorAlertStyle: React.CSSProperties = {
  ...alertStyle,
  backgroundColor: '#f8d7da',
  color: '#721c24',
  border: '1px solid #f5c6cb'
};

const successAlertStyle: React.CSSProperties = {
  ...alertStyle,
  backgroundColor: '#d4edda',
  color: '#155724',
  border: '1px solid #c3e6cb'
};

export default function GoodsForm() {
  // 상태 관리
  const [prompt, setPrompt] = useState("이 돼지 캐릭터가 프린트된 흰색 반팔 티셔츠의 실제 모습을 그려줘.");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(sampleImage1);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [outputFormat, setOutputFormat] = useState("png");
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [seed, setSeed] = useState<number>(11);
  const [isRandomSeed, setIsRandomSeed] = useState(false);
  const [safetyTolerance, setSafetyTolerance] = useState(2);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // ref 생성
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 알림 메시지 표시 함수
  const showError = (message: string) => {
    setError(message);
    setSuccess("");
    setTimeout(() => setError(""), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError("");
    setTimeout(() => setSuccess(""), 5000);
  };

  // URL을 파일로 변환하는 함수
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    try {
      const response = await fetch(url);
      const data = await response.blob();
      const metadata = { type: data.type };
      return new File([data], filename, metadata);
    } catch (error) {
      throw new Error('이미지 로드에 실패했습니다.');
    }
  };

  // 이미지 업로드 처리 함수
  const handleImageUpload = (file: File | null) => {
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        showError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  // 다운로드 함수
  const handleDownload = () => {
    if (!outputUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = outputUrl;
      link.setAttribute('download', `goods-generated-image.${outputFormat}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showSuccess('이미지가 다운로드되었습니다.');
    } catch (error) {
      showError('다운로드 중 오류가 발생했습니다.');
    }
  };

  // 번역 함수
  const handleTranslate = async () => {
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(prompt);
    if (!isKorean) {
      showError("이미 영어 프롬프트입니다. 바로 생성을 진행하세요.");
      return;
    }
    
    setIsTranslating(true);
    setError("");
    
    try {
      const response = await axios.post("/api/goods-gen/translate", { 
        prompt 
      }, {
        timeout: 10000
      });
      
      if (response.data && response.data.translated_text) {
        setPrompt(response.data.translated_text);
        showSuccess("번역이 완료되었습니다.");
      } else {
        throw new Error("번역 결과를 받지 못했습니다.");
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        showError("번역 요청 시간이 초과되었습니다.");
      } else if (error.response) {
        showError(`번역 서비스 오류: ${error.response.data?.message || '알 수 없는 오류'}`);
      } else if (error.request) {
        showError("번역 서비스에 연결할 수 없습니다.");
      } else {
        showError("번역 중 오류가 발생했습니다.");
      }
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // 이미지 생성 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력 검증
    if (!prompt.trim()) {
      showError("프롬프트를 입력해주세요.");
      return;
    }

    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(prompt);
    if (isKorean) {
      showError("프롬프트를 먼저 영어로 번역해주세요.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError("");
    setSuccess("");
    setOutputUrl("");

    try {
      // 이미지 준비
      let finalImage = image;
      
      setProgress(10);
      
      if (!finalImage) {
        finalImage = await urlToFile(sampleImage1, "input_sample1.png");
      }
      
      if (!finalImage) {
        throw new Error("캐릭터 이미지가 필요합니다.");
      }

      setProgress(20);

      // FormData 생성
      const finalSeed = isRandomSeed ? Math.floor(Math.random() * 999999) : seed;
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("input_image", finalImage);
      formData.append("aspect_ratio", aspectRatio);
      formData.append("output_format", outputFormat);
      formData.append("safety_tolerance", safetyTolerance.toString());
      formData.append("seed", finalSeed.toString());

      setProgress(30);

      // API 호출
      const response = await axios.post("/api/goods-gen/generate", formData, {
        responseType: 'blob',
        timeout: 60000, // 60초
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadProgress = Math.round(
              30 + (progressEvent.loaded / progressEvent.total) * 40
            );
            setProgress(uploadProgress);
          }
        }
      });

      setProgress(90);

      // 결과 처리
      if (response.data) {
        const imageUrl = URL.createObjectURL(response.data);
        setOutputUrl(imageUrl);
        showSuccess("굿즈 이미지가 성공적으로 생성되었습니다! 🎉");
        setProgress(100);
      } else {
        throw new Error("이미지 생성 결과를 받지 못했습니다.");
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      
      if (error.code === 'ECONNABORTED') {
        showError("이미지 생성 요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else if (error.response) {
        if (error.response.status === 400) {
          showError("입력값이 올바르지 않습니다. 프롬프트와 이미지를 확인해주세요.");
        } else if (error.response.status === 500) {
          showError("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          showError(`서비스 오류 (${error.response.status}): ${error.response.data?.message || '알 수 없는 오류'}`);
        }
      } else if (error.request) {
        showError("굿즈 생성 서비스에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.");
      } else {
        showError("이미지 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div style={containerStyle}>
      <NavBar />
      
      <div style={cardStyle}>
        <h1 style={titleStyle}>🛍️ 웹툰 캐릭터 굿즈 생성기</h1>
        <p style={subtitleStyle}>AI를 활용한 웹툰 캐릭터 굿즈 디자인 생성 서비스</p>

        {/* 알림 메시지 */}
        {error && <div style={errorAlertStyle}>❌ {error}</div>}
        {success && <div style={successAlertStyle}>✅ {success}</div>}

        <div style={mainContentStyle}>
          {/* 입력 섹션 */}
          <div style={sectionStyle}>
            <h2 style={{marginBottom: '20px', color: '#495057'}}>📝 입력 정보</h2>
            
            <form onSubmit={handleSubmit}>
              {/* 프롬프트 입력 */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>프롬프트 (한국어/영어)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예: 이 돼지 캐릭터가 프린트된 흰색 반팔 티셔츠의 실제 모습을 그려줘"
                  style={textareaStyle}
                  maxLength={500}
                />
                <button 
                  type="button" 
                  onClick={handleTranslate} 
                  disabled={isTranslating} 
                  style={secondaryButtonStyle}
                >
                  {isTranslating ? "번역 중..." : "🌐 한글 → 영어 번역"}
                </button>
              </div>

              {/* 캐릭터 이미지 */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>캐릭터 이미지</label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} 
                  style={fileInputStyle}
                />
                <div style={imagePreviewStyle}>
                  {preview ? (
                    <img src={preview} alt="캐릭터 이미지" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
                  ) : (
                    <p>캐릭터 이미지를 업로드하세요 (최대 10MB)</p>
                  )}
                </div>
              </div>

              {/* 설정 옵션 */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>이미지 비율</label>
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value)} 
                  style={inputStyle}
                >
                  {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>출력 형식</label>
                <select 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value)} 
                  style={inputStyle}
                >
                  <option value="png">PNG (고품질)</option>
                  <option value="jpeg">JPEG (작은 용량)</option>
                </select>
              </div>

              {/* Seed 설정 */}
              <div style={formGroupStyle}>
                <label style={labelStyle}>Seed 설정</label>
                <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
                  <label style={{display: "flex", alignItems: "center", fontSize: "14px"}}>
                    <input 
                      type="radio" 
                      checked={!isRandomSeed} 
                      onChange={() => setIsRandomSeed(false)}
                      style={{marginRight: "6px"}}
                    />
                    고정값 사용
                  </label>
                  <label style={{display: "flex", alignItems: "center", fontSize: "14px"}}>
                    <input 
                      type="radio" 
                      checked={isRandomSeed} 
                      onChange={() => setIsRandomSeed(true)}
                      style={{marginRight: "6px"}}
                    />
                    랜덤 생성
                  </label>
                </div>
                <input 
                  type="number" 
                  value={seed} 
                  onChange={(e) => setSeed(Number(e.target.value))} 
                  disabled={isRandomSeed} 
                  style={{...inputStyle, opacity: isRandomSeed ? 0.5 : 1}}
                  min="0"
                  max="999999"
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Safety Tolerance: {safetyTolerance}</label>
                <input 
                  type="range" 
                  min={0} 
                  max={2} 
                  step={1} 
                  value={safetyTolerance} 
                  onChange={(e) => setSafetyTolerance(Number(e.target.value))} 
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>

              {/* 생성 버튼 */}
              <button 
                type="submit" 
                disabled={loading} 
                style={{
                  ...buttonStyle, 
                  backgroundColor: loading ? "#ccc" : undefined,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "🔄 생성 중..." : "✨ 굿즈 이미지 생성하기"}
              </button>

              {/* 프로그레스 바 */}
              {loading && (
                <div style={progressStyle}>
                  <div style={{...progressBarStyle, width: `${progress}%`}}></div>
                </div>
              )}
            </form>
          </div>

          {/* 출력 섹션 */}
          <div style={sectionStyle}>
            <h2 style={{marginBottom: '20px', color: '#495057'}}>🖼️ 생성 결과</h2>
            
            <div style={imagePreviewStyle}>
              {loading ? (
                <div style={{textAlign: 'center'}}>
                  <p>🎨 이미지를 생성 중입니다...</p>
                  <p style={{fontSize: '12px', marginTop: '10px'}}>잠시만 기다려주세요 (보통 30-60초 소요)</p>
                </div>
              ) : outputUrl ? (
                <img src={outputUrl} alt="생성된 굿즈 이미지" style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px" }} />
              ) : (
                <div style={{textAlign: 'center'}}>
                  <img src={outputSampleImage} alt="예시 이미지" style={{ maxWidth: "100%", maxHeight: "300px", opacity: 0.7, borderRadius: "8px" }} />
                  <p style={{marginTop: '15px', fontSize: '14px'}}>생성된 이미지가 여기에 표시됩니다</p>
                </div>
              )}
            </div>

            {/* 다운로드 버튼 */}
            {outputUrl && !loading && (
              <button 
                onClick={handleDownload} 
                style={buttonStyle}
              >
                📥 이미지 다운로드
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}