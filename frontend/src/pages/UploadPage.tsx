// src/pages/UploadPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/UploadPage.css";

// 도메인 하드코딩 금지! 현재 오리진 + 프리픽스(/api-hl)만 사용
const API_BASE = (process.env.REACT_APP_HL_API ?? "/api-hl").replace(/\/+$/, "");
const MAX_FILES = 20;

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked) return;

    if (picked.length > MAX_FILES) {
      alert(`최대 ${MAX_FILES}장까지만 업로드할 수 있어요.`);

      // ▶ 초과 시 처음 20장만 사용하려면 아래 4줄 주석 해제
      // const dt = new DataTransfer();
      // Array.from(picked).slice(0, MAX_FILES).forEach(f => dt.items.add(f));
      // setFiles(dt.files);
      // return;

      // ▶ 초과 시 아예 취소(리셋)하려면 아래 유지
      e.currentTarget.value = "";
      setFiles(null);
      return;
    }
    setFiles(picked);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;
    if (files.length > MAX_FILES) {
      alert(`최대 ${MAX_FILES}장까지만 업로드할 수 있어요.`);
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f)); // 서버 필드명: 'files' 가정

    try {
      setLoading(true);

      // 절대경로: /api-hl/highlight  → 브라우저가 현재 오리진을 자동 부착
      const res = await axios.post(`${API_BASE}/highlight`, formData, {
        // FormData는 boundary 자동 설정이 더 안전 → Content-Type 헤더 지정 생략
        timeout: 600000, // (선택) 오래 걸릴 수 있으므로 여유 있게
      });

      const resultImage = res.data?.result_image;
      if (!resultImage) throw new Error("결과 이미지가 응답에 없습니다.");

      navigate("/result", { state: { resultImage } });
    } catch (err: any) {
      const r = err?.response;
      const msg = r?.data?.message || r?.data || err?.message || "확실하지 않음";
      alert(
        `업로드 실패: ${r?.status ?? "no-status"} ${r?.statusText ?? ""}\n` +
        `URL: ${r?.config?.url ?? "확실하지 않음"}\n메시지: ${msg}`
      );
      console.error("UPLOAD_FAIL", {
        url: r?.config?.url, status: r?.status, data: r?.data, err,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>이미지를 업로드 해주세요 (최대 {MAX_FILES}장)</h2>

      <div className="file-row">
        <input
          type="text"
          value={files ? `${files.length}개 파일 선택됨` : "선택된 파일 없음"}
          readOnly
        />
        <label htmlFor="file-upload" className="upload-btn">파일 선택</label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleChange}
        />
      </div>

      {files && (
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "하이라이트 생성 중..." : "웹툰 4컷 하이라이트 제작하기"}
        </button>
      )}
    </div>
  );
};

export default UploadPage;
