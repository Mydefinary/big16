import React from 'react';

const Main = () => {
  const styles = {
    webtoonHero: {
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #4ecdc4 0%, #44b39d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif'
    },
    heroContent: {
      textAlign: 'center',
      zIndex: 1,
      maxWidth: '800px',
      padding: '0 20px',
      animation: 'fadeInUp 1s ease-out'
    },
    heroTitle: {
      fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
      fontWeight: 700,
      color: 'white',
      marginBottom: '1.5rem',
      textShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      margin: '0 0 1.5rem 0'
    },
    heroSubtitle: {
      fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
      fontWeight: 400,
      color: 'rgba(255, 255, 255, 0.9)',
      margin: 0,
      lineHeight: 1.6,
      fontStyle: 'italic',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      letterSpacing: '0.01em'
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }
        `}
      </style>
      <div style={styles.webtoonHero}>
        <div 
          style={{
            ...styles.webtoonHero,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
              linear-gradient(135deg, #81dba2ff 0%, #22c55e 100%)
            `,
            pointerEvents: 'none'
          }}
        />
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            "Webtoon WorkFlow AX"
          </h1>
          <p style={styles.heroSubtitle}>
            Seamlessly connecting distribution and content expansion with AI.
          </p>
        </div>
      </div>
    </>
  );
};

export default Main;