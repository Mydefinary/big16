import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ResultPage.css";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    const stateImage = location.state?.resultImage;

    if (stateImage) {
      setResultImage(stateImage);
      localStorage.setItem("resultImage", stateImage); 
    } else {
      const saved = localStorage.getItem("resultImage");
      if (saved) {
        setResultImage(saved);
      }
    }
    console.log("location.state:", location.state);
    console.log("state.resultImage:", location.state?.resultImage);
  }, [location.state]);

  const handleSave = () => {
    if (!resultImage) return;

    const link = document.createElement("a");
    link.href = `data:image/png;base64,${resultImage}`;
    link.download = "highlight.png";
    link.click();
  };

  const handleClose = () => {
    localStorage.removeItem("resultImage");
    navigate("/");
  };

  return (
    <div className="result-container">
      {resultImage ? (
        <>
          <img
            src={`data:image/png;base64,${resultImage}`}
            alt="하이라이트 결과"
            className="result-image"
          />
          <div className="result-buttons">
            <button className="save-btn" onClick={handleSave}>파일 저장</button>
            <button className="close-btn" onClick={handleClose}>닫기</button>
          </div>
        </>
      ) : (
        <p>결과 이미지가 없습니다.</p>
      )}
    </div>
  );
};

export default ResultPage;
