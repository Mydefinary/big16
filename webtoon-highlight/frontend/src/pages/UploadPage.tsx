import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/UploadPage.css";

const UploadPage = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

const handleSubmit = async () => {
  if (!files || files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  try {
    setLoading(true);
    const response = await axios.post("http://127.0.0.1:8000/highlight", formData);

    console.log("백엔드 응답:", response.data);
    console.log("result_image 값:", response.data.result_image);

    const resultImage = response.data.result_image;

    // base64 이미지 데이터를 state로 전달
    navigate("/result", { state: { resultImage } });
  } catch (error) {
    console.error("업로드 실패:", error);
    alert("업로드에 실패했습니다. 다시 시도해주세요.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="upload-container">
      <h2>이미지를 업로드 해주세요 (최대 20장)</h2>
      <div className="file-row">
        <input
          type="text"
          value={files ? `${files.length}개 파일 선택됨` : "선택된 파일 없음"}
          readOnly
        />
        <label htmlFor="file-upload" className="upload-btn">
          파일 선택
        </label>
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


