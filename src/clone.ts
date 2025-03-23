import { showErrorDialog } from "./dialog";

const voiceUploadEl = document.getElementById("voice-upload") as HTMLInputElement;
const recordStateEl = document.getElementById("record-state") as HTMLSpanElement;
const voiceRecordBtn = document.getElementById("voice-record") as HTMLButtonElement;
const voicePreviewEl = document.getElementById("voice-preview") as HTMLAudioElement;

export let promptFile: Blob | null = null;

voiceUploadEl.addEventListener("change", async () => {
  voicePreviewEl.src = URL.createObjectURL(voiceUploadEl.files![0]);
  promptFile = voiceUploadEl.files![0];
});

let recorder: MediaRecorder | null = null;

async function getRecorder(): Promise<MediaRecorder> {
  if(!recorder){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
    }catch(e){
      showErrorDialog("无法获取录音权限");
      return Promise.reject(e);
    }
  }
  return recorder!;
}

async function convertToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const wavHeader = createWavHeader(arrayBuffer.byteLength);
  return new Blob([wavHeader, arrayBuffer], { type: 'audio/wav' });
}

function createWavHeader(dataLength: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  // RIFF标识
  writeString(view, 0, 'RIFF');
  view.setUint32(4, dataLength + 36, true); // 文件总长度
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt块长度
  view.setUint16(20, 1, true); // PCM格式
  view.setUint16(22, 1, true); // 单声道
  view.setUint32(24, 16000, true); // 采样率
  view.setUint32(28, 32000, true); // 字节率 = 采样率 * 位深/8 * 通道数
  view.setUint16(32, 2, true); // 块对齐
  view.setUint16(34, 16, true); // 位深
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // 数据长度
  
  return buffer;
  
  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}

voiceRecordBtn.addEventListener("click", async () => {
  const recorder = await getRecorder();
  if(recorder.state === "recording"){
    recorder.stop();
    recordStateEl.innerText = "开始录音";
    return;
  }
  let chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (e) => {
    chunks.push(e.data);
  });
  recorder.addEventListener("stop", async () => {
    const audioBlob = new Blob(chunks, { type: 'audio/wav' });
    voicePreviewEl.src = URL.createObjectURL(audioBlob);
    promptFile = await convertToWav(audioBlob);
    chunks = [];
  });
  recorder.start();
  recordStateEl.innerText = "录音中";
});