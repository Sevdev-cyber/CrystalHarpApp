
import React, { useEffect, useState, useRef } from 'react';

interface BackgroundDynamicsProps {
  activityIntensity: number;
  lowPower?: boolean;
  motionEnabled?: boolean;
}

const BackgroundDynamics: React.FC<BackgroundDynamicsProps> = ({ activityIntensity, lowPower = false, motionEnabled = true }) => {
  const [blobs, setBlobs] = useState<{ id: number; x: number; y: number; size: number; color: string; duration: number; delay: number }[]>([]);

  useEffect(() => {
    // Initial generation of subtle moving light blobs
    const blobCount = lowPower ? 3 : 8;
    const newBlobs = Array.from({ length: blobCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: (lowPower ? 180 : 300) + Math.random() * (lowPower ? 220 : 400),
      color: [
        'rgba(199, 210, 254, 0.1)', // indigo
        'rgba(251, 207, 232, 0.1)', // pink
        'rgba(186, 230, 253, 0.1)', // blue
        'rgba(187, 247, 208, 0.1)', // green
      ][Math.floor(Math.random() * 4)],
      duration: (lowPower ? 22 : 15) + Math.random() * (lowPower ? 18 : 20),
      delay: Math.random() * -20,
    }));
    setBlobs(newBlobs);
  }, [lowPower]);

  // Effect intensity factor based on last activity
  const [activeIntensity, setActiveIntensity] = useState(1);
  useEffect(() => {
    if (lowPower) return;
    if (!motionEnabled) return;
    setActiveIntensity(1.5);
    const timeout = setTimeout(() => setActiveIntensity(1), 2000);
    return () => clearTimeout(timeout);
  }, [activityIntensity, lowPower, motionEnabled]);

  const blurClass = lowPower ? 'blur-[40px]' : 'blur-[100px]';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {blobs.map(blob => (
        <div
          key={blob.id}
          className={`absolute rounded-full ${blurClass} transition-transform duration-1000 ease-out`}
          style={{
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            backgroundColor: blob.color,
            animation: lowPower || !motionEnabled ? 'none' : `float-blob ${blob.duration}s infinite linear`,
            animationDelay: `${blob.delay}s`,
            transform: lowPower || !motionEnabled ? 'scale(1)' : `scale(${activeIntensity})`,
            opacity: lowPower || !motionEnabled ? 0.12 : 0.15 + (activeIntensity - 1) * 0.1
          }}
        />
      ))}
      <style>{`
        @keyframes float-blob {
          0% { transform: translate(-20%, -20%) rotate(0deg); }
          50% { transform: translate(20%, 20%) rotate(180deg); }
          100% { transform: translate(-20%, -20%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BackgroundDynamics;
