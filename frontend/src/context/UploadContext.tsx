/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState,useEffect } from "react";

interface UploadContextType {
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
  progress: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  cancelUpload: (() => void) | null;
  setCancelUpload: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  canUpload: () => boolean; 
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cancelUpload, setCancelUpload] = useState<(() => void) | null>(null);

  useEffect(() => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (uploading) {
      event.preventDefault();
      event.returnValue = "Upload in progress. Are you sure you want to leave?";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [uploading]);


  
  const canUpload = () => !uploading;

  return (
    <UploadContext.Provider
      value={{
        uploading,
        setUploading,
        progress,
        setProgress,
        cancelUpload,
        setCancelUpload,
        canUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within UploadProvider");
  }
  return context;
};
