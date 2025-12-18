import React, { useRef, useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";

interface CameraCaptureModalProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCaptured, setIsCaptured] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error(error);
        // alert("Unable to access camera. Please allow camera permissions.");
        onClose();
      }
    };

    startCamera();

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onClose]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (!context) return;
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile_photo.jpg", {
            type: "image/jpeg",
          });
          onCapture(file);
        }
      }, "image/jpeg");
      setIsCaptured(true);
    }
  };

  return (
    // <div className="fixed inset-0 bg-grey-100 z-50 flex justify-center items-center p-4 ">
    //   <div className="bg-white rounded-lg w-full max-w-[800px] flex flex-col animate-fadeIn shadow-lg overflow-hidden mt-8 ">

     <div className="fixed inset-0 bg-gray z-50 flex justify-center items-start p-4">
        <div className="bg-white rounded-lg w-full max-w-[800px] flex flex-col animate-fadeIn shadow-lg overflow-hidden mt-8">
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
          <h2 className="text-[18px] font-semibold text-gray-900">Take photo</h2>
          <button
            title="close"
            onClick={onClose}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        
        <div className="flex justify-center items-center bg-black">
          <div className="relative w-full max-w-[800px] aspect-video bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-contain rounded-md"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        
        <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="text-gray-700 font-semibold px-4 py-2 rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            className="text-white bg-blue-600 font-semibold px-5 py-2 rounded-full hover:bg-blue-700 transition"
          >
            {isCaptured ? "clicking" : "Take photo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;