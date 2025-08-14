import React, { useState } from "react";
import axios from "axios";
import NavBar from "./NavBar.tsx";

// --- 샘플 이미지 임포트 ---
// 1. 요청하신 대로 `assets` 폴더에서 샘플 이미지들을 가져옵니다.
//    이 이미지들은 초기 화면에 표시될 기본 이미지입니다.
import sampleImage1 from "../assets/input_sample1.png";
import sampleImage2 from "../assets/input_sample2.jpg";
import outputSampleImage from "../assets/output_sample.png";

// --- 스타일 정의 (기존 코드와 동일) ---
const aspectRatios = [ "match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "4:5", "5:4", "21:9", "9:21", "2:1", "1:2" ];
const containerStyle: React.CSSProperties = { fontFamily: "'Nanum Gothic', sans-serif", backgroundColor: "#ffffff", minHeight: "100vh", margin: 0, padding: 0, overflowX: "hidden" };
const mainContentStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "40px", maxWidth: "1440px", margin: "0 auto", padding: "20px", alignItems: "flex-start", boxSizing: "border-box" };
const formColumnStyle: React.CSSProperties = { flex: "1 1 400px", minWidth: "320px", textAlign: "left" };
const outputColumnStyle: React.CSSProperties = { flex: "1 1 400px", minWidth: "320px", textAlign: "left", paddingTop: "20px" };
const fileInputBoxStyle: React.CSSProperties = { width: '100%', padding: '8px', marginBottom: '16px', marginTop: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
const imagePreviewFrameStyle: React.CSSProperties = { border: "1px solid #ddd", borderRadius: "8px", padding: "10px", marginTop: "8px", marginBottom: "24px", backgroundColor: "#f9f9f9", display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: "300px", width: "100%", color: "#aaa", fontSize: "14px", boxSizing: 'border-box' };
const promptBoxStyle: React.CSSProperties = { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '40px', resize: 'vertical', boxSizing: 'border-box' };
const generateButtonStyle: React.CSSProperties = { width: '100%', height: '56px', padding: '14px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#09AA5C', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' };
const downloadButtonStyle: React.CSSProperties = { width: '100%', height: '56px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#09AA5C', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' };
const translateButtonStyle: React.CSSProperties = { padding: '8px 12px', marginBottom: '16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' };

export default function GenerateForm() {
  // --- 상태 관리 ---
  const [prompt, setPrompt] = useState("이 가방을 들고 걷고 있는 그림 속 여성을 그려줘.");
  const [image1, setImage1] = useState<File | null>(null); // 사용자가 업로드한 '파일' 자체를 저장
  const [image2, setImage2] = useState<File | null>(null);

  // 2. (요구사항 1, 2) '미리보기' 상태의 초기값을 임포트한 샘플 이미지로 설정합니다.
  //    이렇게 하면 웹사이트에 처음 접속했을 때 샘플 이미지가 바로 보이게 됩니다.
  const [preview1, setPreview1] = useState<string>(sampleImage1);
  const [preview2, setPreview2] = useState<string>(sampleImage2);
  
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [outputFormat, setOutputFormat] = useState("png");
  
  // 3. (요구사항 3) 출력 이미지 URL 상태는 초기에 비워둡니다.
  //    이 값이 비어있으면, 아래 렌더링 로직에서 outputSampleImage를 보여주게 됩니다.
  const [outputUrl, setOutputUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState<number>(11);
  const [isRandomSeed, setIsRandomSeed] = useState(false);
  const [safetyTolerance, setSafetyTolerance] = useState(2);
  const [isTranslating, setIsTranslating] = useState(false);

  // --- 함수 정의 (기존 코드와 대부분 동일) ---

  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    const data = await response.blob();
    const metadata = { type: data.type };
    return new File([data], filename, metadata);
  };

  const handleImageUpload = (
    file: File | null,
    setImage: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    // 4. (요구사항 4) 사용자가 새 이미지를 선택하면 이 함수가 호출됩니다.
    if (file) {
      setImage(file);
      // URL.createObjectURL을 사용해 선택한 파일의 미리보기를 생성하고,
      // preview 상태를 업데이트합니다. 이로 인해 샘플 이미지가 사용자가 올린 이미지로 대체됩니다.
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const link = document.createElement('a');
    link.href = outputUrl;
    link.setAttribute('download', `generated-ppl-image.${outputFormat}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const handleTranslate = async () => {
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(prompt);
    if (!isKorean) {
      alert("이미 영어 프롬프트입니다. 바로 생성을 진행하세요.");
      return;
    }
    setIsTranslating(true);
    try {
      const response = await axios.post("/api/ppl-gen/translate", { prompt });
      setPrompt(response.data.translated_text);
    } catch (error) {
      alert("번역에 실패했습니다.");
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(prompt);
    if (isKorean) {
      alert("프롬프트를 먼저 영어로 번역해주세요.");
      return;
    }

    // 사용자가 이미지를 업로드하지 않으면 샘플 이미지를 서버에 전송합니다.
    let finalImage1 = image1;
    let finalImage2 = image2;
    if (!finalImage1) {
      finalImage1 = await urlToFile(sampleImage1, "input_sample1.png");
    }
    if (!finalImage2) {
      finalImage2 = await urlToFile(sampleImage2, "input_sample2.jpg");
    }
    
    if (!finalImage1 || !finalImage2) {
      alert("이미지 두 개가 모두 필요합니다.");
      return;
    }

    const finalSeed = isRandomSeed ? Math.floor(Math.random() * 999999) : seed;
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("input_image_1", finalImage1);
    formData.append("input_image_2", finalImage2);
    formData.append("aspect_ratio", aspectRatio);
    formData.append("output_format", outputFormat);
    formData.append("safety_tolerance", safetyTolerance.toString());
    formData.append("seed", finalSeed.toString());

    setLoading(true);
    // 5. (요구사항 5의 일부) 생성 시작 시, 이전 결과 이미지 URL을 초기화합니다.
    // 만약 이전에 생성된 이미지가 있었다면, 이 시점에서 화면에서는 로딩 메시지가 표시됩니다.
    setOutputUrl("");

    try {
      const response = await axios.post("/api/ppl-gen/generate", formData, {
        responseType: 'blob',
      });
      const imageUrl = URL.createObjectURL(response.data);
      // 6. (요구사항 5) 이미지 생성이 성공하면, 결과 이미지 URL을 상태에 저장합니다.
      //    이로 인해 출력 영역이 리렌더링되어 샘플 이미지가 아닌, 새로 생성된 이미지를 보여줍니다.
      setOutputUrl(imageUrl);
    } catch (error) {
      alert("이미지 생성에 실패했습니다. 입력 값이나 모델 상태를 확인해 주세요.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <NavBar />
      <div style={mainContentStyle}>
        <div style={formColumnStyle}>
          <h2 style={{ marginBottom: '30px' }}>웹툰 캐릭터 PPL 생성기</h2>
          <form onSubmit={handleSubmit}>
            {/* --- 프롬프트 입력 영역 --- */}
            <label htmlFor="prompt" style={{ fontWeight: "bold", display: 'block', marginBottom: '6px' }}>프롬프트를 입력하세요 (한/영)</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={promptBoxStyle}
            />
            <button type="button" onClick={handleTranslate} disabled={isTranslating} style={translateButtonStyle}>
              {isTranslating ? "번역 중..." : "한글 프롬프트 번역하기"}
            </button>
            
            {/* --- 캐릭터 이미지 입력 --- */}
            <label style={{ fontWeight: "bold", display: 'block', marginBottom: '8px', marginTop: '20px' }}>① 캐릭터 이미지</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] || null, setImage1, setPreview1)} style={fileInputBoxStyle} />
            <div style={imagePreviewFrameStyle}>
              {/* `preview1` 상태를 이용해 이미지를 표시합니다. 초기값은 sampleImage1입니다. */}
              {preview1 ? <img src={preview1} alt="캐릭터 이미지" style={{ maxWidth: "100%", maxHeight: "300px" }} /> : <p>이미지를 업로드 하세요.</p>}
            </div>

            {/* --- 제품 이미지 입력 --- */}
            <label style={{ fontWeight: "bold", display: 'block', marginBottom: '8px' }}>② 제품 이미지</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] || null, setImage2, setPreview2)} style={fileInputBoxStyle} />
            <div style={imagePreviewFrameStyle}>
              {/* `preview2` 상태를 이용해 이미지를 표시합니다. 초기값은 sampleImage2입니다. */}
              {preview2 ? <img src={preview2} alt="제품 이미지" style={{ maxWidth: "100%", maxHeight: "300px" }} /> : <p>이미지를 업로드 하세요.</p>}
            </div>

            {/* --- 기타 설정 (기존과 동일) --- */}
            <label style={{ fontWeight: "bold", display: 'block', marginBottom: '8px' }}>이미지 비율</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={fileInputBoxStyle}>
              {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <label style={{ fontWeight: "bold", display: 'block', marginBottom: '8px' }}>출력 형식</label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} style={fileInputBoxStyle}>
              <option value="png">png</option>
              <option value="jpeg">jpeg</option>
            </select>
            <label style={{ fontWeight: "bold", display: 'block', marginTop: "20px" }}>Seed 설정</label>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <div>
                <input type="radio" id="fixedSeed" name="seedMode" checked={!isRandomSeed} onChange={() => setIsRandomSeed(false)} />
                <label htmlFor="fixedSeed" style={{ marginLeft: "4px" }}>고정값 사용</label>
              </div>
              <div>
                <input type="radio" id="randomSeed" name="seedMode" checked={isRandomSeed} onChange={() => setIsRandomSeed(true)} />
                <label htmlFor="randomSeed" style={{ marginLeft: "4px" }}>랜덤하게 생성</label>
              </div>
            </div>
            <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} disabled={isRandomSeed} style={fileInputBoxStyle} />
            <label htmlFor="safetyTolerance" style={{ fontWeight: "bold" }}>Safety Tolerance(프롬프트 적용): {safetyTolerance}</label>
            <input id="safetyTolerance" type="range" min={0} max={2} step={1} value={safetyTolerance} onChange={(e) => setSafetyTolerance(Number(e.target.value))} style={{ width: '100%', marginTop: '8px', marginBottom: '16px' }} />
            
            <button type="submit" disabled={loading} style={{ ...generateButtonStyle, backgroundColor: loading ? "#ccc" : "#09AA5C" }}>
              {loading ? "생성 중..." : "PPL 이미지 생성✨"}
            </button>
          </form>
        </div>
        
        {/* --- 출력 이미지 영역 --- */}
        <div style={outputColumnStyle}>
          <h3 style={{ marginBottom: "10px" }}>출력 이미지</h3>
          <div style={imagePreviewFrameStyle}>
            {/* 7. 출력 로직을 정리했습니다.
                - loading 중일 때는 '생성 중' 메시지를 표시합니다.
                - loading이 아니고 outputUrl에 값이 있으면(성공적으로 생성되면) 해당 이미지를 표시합니다.
                - loading이 아니고 outputUrl에 값이 없으면(초기 상태 또는 실패 시) 샘플 출력 이미지를 표시합니다.
            */}
            {loading ? (
              <p>이미지를 생성 중입니다...</p>
            ) : outputUrl ? (
              <img src={outputUrl} alt="출력 이미지" style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }} />
            ) : (
              <img src={outputSampleImage} alt="출력 예시" style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }} />
            )}
          </div>
          {outputUrl && !loading && (
            <button onClick={handleDownload} style={downloadButtonStyle}>
              📥 이미지 다운로드
            </button>
          )}
        </div>
      </div>
    </div>
  );
}