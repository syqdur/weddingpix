import React, { useState, useRef } from 'react';
import { Plus, Camera, Mic, Square } from 'lucide-react';

interface UploadSectionProps {
  onUpload: (files: FileList) => Promise<void>;
  onAudioUpload: (audioBlob: Blob) => Promise<void>;
  isUploading: boolean;
  progress: number;
  isDarkMode: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUpload,
  onAudioUpload,
  isUploading,
  progress,
  isDarkMode
}) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Fehler beim Starten der Aufnahme. Bitte erlaube den Zugriff auf das Mikrofon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className={`p-4 border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Plus className={`w-6 h-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Neuer Beitrag
          </h3>
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Teile deine schönsten Momente von der Hochzeit
          </p>
          {progress > 0 && (
            <div className={`w-full h-1 rounded-full mt-2 overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Camera className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`p-2 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};