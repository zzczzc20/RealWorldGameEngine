import React, { useState } from 'react';
import CameraScanner from '../components/CameraScanner';
import CyberButton from '../components/ui/CyberButton';

function CameraView({ onBack }) {
  const [scanResult, setScanResult] = useState(null);

  const handleScanResult = (result) => {
    setScanResult(result);
    // 检查结果是否为URL，如果是则询问用户是否要打开网页
    if (result && result.startsWith('http')) {
      setTimeout(() => {
        if (window.confirm(`是否要打开扫描到的网址：${result}？`)) {
          window.open(result, '_blank');
        }
      }, 100); // 延迟以确保UI更新后弹出对话框
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">摄像头扫描</h1>
        <CyberButton onClick={onBack} className="!bg-gray-700 hover:!bg-gray-600 !text-cyan-300">
          {'< 返回地图'}
        </CyberButton>
      </div>
      <div className="bg-gray-800 border border-cyan-600 rounded-lg p-6">
        <CameraScanner onQRCodeDetected={handleScanResult} />
        {scanResult && (
          <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded">
            <p className="text-lg font-bold text-green-300">扫描结果</p>
            <p className="text-sm text-gray-300 mt-1">内容: {scanResult}</p>
            {scanResult.startsWith('http') && (
              <a
                href={scanResult}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline mt-2 block"
              >
                点击这里打开链接
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraView;