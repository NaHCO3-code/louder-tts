import { Client } from "@gradio/client";
import { config } from "./config";
import { showErrorDialog } from "./dialog";
import "./clone";
import { promptFile } from "./clone";

enum Mode {
  Clone = "clone",
  Create = "create",
}

let mode: Mode = Mode.Clone;

const modeSelectBtns = {
  [Mode.Clone]: document.getElementById("tab-clone")!,
  [Mode.Create]: document.getElementById("tab-creation")!,
};

function changeMode(newMode: Mode) {
  modeSelectBtns[mode].setAttribute("aria-selected", "false");
  modeSelectBtns[newMode].setAttribute("aria-selected", "true");
  mode = newMode;
}

(function () {
  for (const mode in modeSelectBtns) {
    const btn = modeSelectBtns[mode as Mode];
    btn.addEventListener("click", () => {
      changeMode(mode as Mode);
    });
  }
})();

const textToSpeak = document.getElementById(
  "text-to-speak"
) as HTMLTextAreaElement;
const pitchSlider = document.getElementById("pitch") as HTMLInputElement;
const speedSlider = document.getElementById("speed") as HTMLInputElement;
const pitchLabel = document.getElementById("pitch-label") as HTMLLabelElement;
const speedLabel = document.getElementById("speed-label") as HTMLLabelElement;
const generateBtn = document.getElementById("generate") as HTMLButtonElement;
const resultAudioEl = document.getElementById("result") as HTMLAudioElement;
const resultDownloadBtn = document.getElementById(
  "download"
) as HTMLButtonElement;

pitchSlider.addEventListener("input", () => {
  pitchLabel.innerText = `${pitchSlider.value}`;
});

speedSlider.addEventListener("input", () => {
  speedLabel.innerText = `${speedSlider.value}`;
});

generateBtn.addEventListener("click", () => {
  if (mode === Mode.Create) {
    createVoice();
  } else if (mode === Mode.Clone) {
    cloneVoice();
  }
});

resultDownloadBtn.addEventListener("click", () => {
  // 获取当前音频源地址
  const audioUrl = resultAudioEl.src;

  if (!audioUrl) {
    showErrorDialog("音频不存在");
    return;
  }

  // 创建隐藏的下载链接
  const link = document.createElement("a");
  link.href = audioUrl;
  link.download = `TTS_${Date.now()}.wav`; // 设置默认文件名
  link.style.display = "none";

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

let timerInterval: number | null = null;

function setBusy() {
  textToSpeak.disabled = true;
  generateBtn.disabled = true;
  generateBtn.innerText = "连接中...";
  let estimateTime = Math.round(
    textToSpeak.value.length * config.timeEstimateRate + 10
  );
  let currentTime = 0;
  timerInterval = setInterval(() => {
    generateBtn.innerText = `生成中，预估用时 ${estimateTime}s (${currentTime}s)`;
    currentTime++;
  }, 1000);
}

function setIdle() {
  textToSpeak.disabled = false;
  generateBtn.disabled = false;
  generateBtn.innerText = "生成语音";
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

async function createVoice() {
  const text = textToSpeak.value;
  const genderSelect = document.querySelector(
    "input[name='gender']:checked"
  ) as HTMLSelectElement;
  const pitchValue = parseFloat(pitchSlider.value);
  const speedValue = parseFloat(speedSlider.value);
  console.log(
    `Gender: ${genderSelect.value}, Pitch: ${pitchValue}, Speed: ${speedValue}`
  );

  setBusy();
  try {
    const client = await Client.connect(config.apiHost);
    const result = await client.predict("/voice_creation", {
      text: text,
      gender: genderSelect.value,
      pitch: pitchValue,
      speed: speedValue,
    });
    setIdle();
    console.log(result);
    // @ts-ignore
    resultAudioEl.src = result.data[0].url;
  } catch (e) {
    setIdle();
    console.error("An unexpected error occurred:", e);
    showErrorDialog(
      "An unexpected error occurred while creating the voice. Please try again."
    );
  }
}


async function cloneVoice() {
  const text = textToSpeak.value;
  const voiceFile = promptFile;
  console.log(voiceFile)
  const trainingText = (
    document.getElementById("training-text") as HTMLTextAreaElement
  ).value;
  if (!voiceFile) {
    showErrorDialog("请上传音频文件或录制音频");
    return;
  }
  if (trainingText.length === 0) {
    showErrorDialog("请输入训练文本");
    return;
  }

  setBusy();
  try {
    const client = await Client.connect(config.apiHost);
    const result = await client.predict("/voice_clone", {
      text,
      prompt_text: trainingText,
      prompt_wav_upload: voiceFile,
      prompt_wav_record: voiceFile,
    });
    setIdle();
    console.log(result);
    // @ts-ignore
    resultAudioEl.src = result.data[0].url;
  } catch (e) {
    setIdle();
    console.error("An unexpected error occurred:", e);
    showErrorDialog(
      "An unexpected error occurred while cloning the voice. Please try again."
    );
  }
}
