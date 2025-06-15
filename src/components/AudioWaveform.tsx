import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  audioElement?: HTMLAudioElement | null;
  className?: string;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording = false,
  isPlaying = false,
  audioElement,
  className = '',
  color = '#ec4899'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize audio context for recording
  useEffect(() => {
    if (isRecording && !audioContextRef.current) {
      const initRecordingVisualization = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          
          analyser.fftSize = 256;
          source.connect(analyser);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
          
          drawRecordingWaveform();
        } catch (error) {
          console.error('Error initializing recording visualization:', error);
        }
      };
      
      initRecordingVisualization();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isRecording]);

  // Initialize audio context for playback
  useEffect(() => {
    if (isPlaying && audioElement && !audioContextRef.current) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioElement);
        
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        
        drawPlaybackWaveform();
      } catch (error) {
        console.error('Error initializing playback visualization:', error);
      }
    }
  }, [isPlaying, audioElement]);

  const drawRecordingWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!canvas || !analyser || !dataArray) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / dataArray.length * 2;
      let x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '40');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const drawPlaybackWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!canvas || !analyser || !dataArray) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      if (!isPlaying) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / dataArray.length * 2;
      let x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '40');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const drawStaticWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 32;
    const barWidth = canvas.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.random() * canvas.height * 0.3 + 10;
      
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      gradient.addColorStop(0, color + '60');
      gradient.addColorStop(1, color + '20');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }
  };

  useEffect(() => {
    if (!isRecording && !isPlaying) {
      drawStaticWaveform();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className={`${className}`}
      style={{ width: '100%', height: '60px' }}
    />
  );
};