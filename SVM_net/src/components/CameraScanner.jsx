import React, { useEffect, useRef, useState } from 'react';
import CameraService from '../services/CameraService';
import { subscribe, unsubscribe } from '../services/EventService';

const CameraScanner = ({ onQRCodeDetected }) => {
  const videoRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 确保视频元素存在
    if (videoRef.current) {
      CameraService.startCamera({ videoElementId: videoRef.current.id });
    }

    // 订阅摄像头事件
    subscribe('cameraStarted', handleCameraStarted);
    subscribe('cameraStopped', handleCameraStopped);
    subscribe('cameraError', handleCameraError);
    subscribe('qrCodeDetected', handleQRCodeDetected);
    subscribe('qrCodeError', handleQRCodeError);

    // 组件卸载时清理
    return () => {
      CameraService.stopCamera();
      unsubscribe('cameraStarted', handleCameraStarted);
      unsubscribe('cameraStopped', handleCameraStopped);
      unsubscribe('cameraError', handleCameraError);
      unsubscribe('qrCodeDetected', handleQRCodeDetected);
      unsubscribe('qrCodeError', handleQRCodeError);
    };
  }, []);

  const handleCameraStarted = (data) => {
    setCameraStatus('active');
    setErrorMessage('');
    // 开始二维码扫描
    CameraService.startQRCodeScanning({ callback: onQRCodeDetected });
  };

  const handleCameraStopped = (data) => {
    setCameraStatus('inactive');
  };

  const handleCameraError = (data) => {
    setCameraStatus('error');
    setErrorMessage(data.error);
  };

  const handleQRCodeDetected = (data) => {
    setCameraStatus('qrDetected');
    if (onQRCodeDetected) {
      onQRCodeDetected(data.data);
    }
  };

  const handleQRCodeError = (data) => {
    setErrorMessage(data.error);
  };

  return (
    <div className="camera-scanner">
      <video
        id="cameraVideo"
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', maxWidth: '500px', height: 'auto' }}
      />
      <div className="status">
        {cameraStatus === 'active' && <p>摄像头已启动，正在扫描二维码...</p>}
        {cameraStatus === 'inactive' && <p>摄像头未启动</p>}
        {cameraStatus === 'error' && <p>错误: {errorMessage}</p>}
        {cameraStatus === 'qrDetected' && <p>二维码已检测到</p>}
      </div>
    </div>
  );
};

export default CameraScanner;