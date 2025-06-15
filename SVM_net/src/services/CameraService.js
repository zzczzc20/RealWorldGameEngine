// CameraService.js - 服务用于处理摄像头调用和二维码扫描，以及未来的扩展功能如实体识别

import { publish, subscribe, unsubscribe } from './EventService';

/**
 * CameraService 类，负责管理摄像头访问和处理图像数据
 */
class CameraService {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.isCameraActive = false;
    this.qrCodeCallback = null;
    this.subscribers = {};
    this.boundStartCamera = this.startCamera.bind(this);
    this.boundStopCamera = this.stopCamera.bind(this);
    this.boundStartQRCodeScanning = this.startQRCodeScanning.bind(this);
    this.init();
  }

  /**
   * 初始化服务，设置事件监听
   */
  init() {
    subscribe('startCamera', this.boundStartCamera);
    subscribe('stopCamera', this.boundStopCamera);
    subscribe('scanQRCode', this.boundStartQRCodeScanning);
  }

  /**
   * 启动摄像头
   * @param {Object} data - 包含视频元素ID或其他配置
   */
  async startCamera(data) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头访问');
      }

      this.videoElement = document.getElementById(data.videoElementId);
      if (!this.videoElement) {
        throw new Error('未找到视频元素');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();
      this.isCameraActive = true;
      publish('cameraStarted', { success: true });
    } catch (error) {
      console.error('启动摄像头失败:', error);
      publish('cameraError', { error: error.message });
    }
  }

  /**
   * 停止摄像头
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isCameraActive = false;
    publish('cameraStopped', { success: true });
  }

  /**
   * 开始二维码扫描
   * @param {Object} data - 配置数据，如回调函数
   */
  startQRCodeScanning(data) {
    if (!this.isCameraActive) {
      publish('qrCodeError', { error: '摄像头未启动' });
      return;
    }

    this.qrCodeCallback = data.callback || null;
    this.scanQRCode();
  }

  /**
   * 扫描二维码的内部实现
   */
  scanQRCode() {
    if (!this.isCameraActive) {
      return;
    }

    if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
      requestAnimationFrame(this.scanQRCode.bind(this));
      return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // 这里使用 jsQR 库进行二维码识别
    // 注意：需要在项目中引入 jsQR 库
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        publish('qrCodeDetected', { data: code.data });
        if (this.qrCodeCallback) {
          this.qrCodeCallback(code.data);
        }
        return;
      }
    } else {
      console.warn('jsQR 库未加载');
    }

    requestAnimationFrame(this.scanQRCode.bind(this));
  }

  /**
   * 为未来扩展准备的占位方法，如实体识别
   * @param {Object} data - 配置数据
   */
  startObjectDetection(data) {
    // 未来实现，如使用 YOLO 模型进行实体识别
    console.log('实体识别功能待实现', data);
    publish('objectDetectionStarted', { message: '功能待实现' });
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.stopCamera();
    unsubscribe('startCamera', this.boundStartCamera);
    unsubscribe('stopCamera', this.boundStopCamera);
    unsubscribe('scanQRCode', this.boundStartQRCodeScanning);
  }
}

// 导出单例实例
export default new CameraService();