// src/components/Stars.jsx
import React, { useMemo } from "react";

const Stars = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const size = Math.random() * 2 + 1.5;
      const style = {
        width: size + "px",
        height: size + "px",
        top: Math.random() * 100 + "%",
        left: Math.random() * 100 + "%",
        animationDelay: Math.random() * 3 + "s",
      };
      return <div key={i} className="star" style={style}></div>;
    });
  }, []);

  return <div className="stars">{stars}</div>;
};

export default Stars;
