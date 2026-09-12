import { useEffect, useRef, useState } from "react";
import { ProductIcon, type ProductIconKind } from "../components/ProductIcon";
import { SpectralBackdrop } from "../components/spectral/SpectralBackdrop";
import { spectralPresets, type SpectralPreset } from "../components/spectral/motionPolicy";

/** Development-only art board. Exports are made by the real renderer, not approximations. */
export default function SpectralLab() {
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get("spectralPreset") as SpectralPreset;
  const preset: SpectralPreset = candidate in spectralPresets ? candidate : "home";
  const stage = useRef<HTMLDivElement>(null);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); if (recorder.current?.state === "recording") recorder.current.stop(); }; }, []);
  const icons: ProductIconKind[] = ["learn", "assess", "concepts", "content", "cache", "layers", "matrix", "wave", "target", "branch", "discussion", "assistant", "reveal"];
  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = name; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportFrame() {
    const canvas = stage.current?.querySelector("canvas");
    if (!canvas) { setNotice("当前为静态降级模式"); return; }
    canvas.toBlob(blob => { if (blob) { download(blob, "ceptlens-spectral-"+preset+".webp"); setNotice("已导出真实着色器画面"); } }, "image/webp", .93);
  }
  function recordLoop() {
    const canvas = stage.current?.querySelector("canvas");
    if (!canvas || !window.MediaRecorder || !canvas.captureStream) { setNotice("此浏览器不支持录制"); return; }
    const stream = canvas.captureStream(30);
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) { stream.getTracks().forEach(track => track.stop()); setNotice("没有可用的录制编码器"); return; }
    const session = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
    recorder.current = session;
    const chunks: Blob[] = [];
    session.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    session.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      if (mounted.current) { download(new Blob(chunks, { type: mime }), "ceptlens-spectral-loop.webm"); setRecording(false); setNotice("16 秒动画已导出"); }
    };
    session.start(); setRecording(true); setNotice("正在录制 16 秒动画…");
    timer.current = window.setTimeout(() => session.stop(), 16000);
  }
  return <div className="spectral-lab">
    <header><h1>光谱视觉样板</h1><a href="#/">回到首页</a></header>
    <div className="spectral-lab-toolbar"><label>场景 <select value={preset} onChange={event => { const url = new URL(window.location.href); url.searchParams.set("spectralPreset",event.target.value); window.location.assign(url); }}>{Object.keys(spectralPresets).map(key => <option key={key}>{key}</option>)}</select></label>
      <button className="secondary-button" onClick={exportFrame}>导出静态画面</button><button className="secondary-button" disabled={recording || params.has("spectralFrame")} onClick={recordLoop}>{recording ? "录制中…" : "录制 16 秒动画"}</button>
      <button className="secondary-button" onClick={() => stage.current?.querySelector("canvas")?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext()}>测试 WebGL 降级</button><span role="status">{notice}</span>
    </div>
    <div className="spectral-lab-stage" ref={stage}><SpectralBackdrop preset={preset}/></div>
    <section className="spectral-lab-icons" aria-label="图标样板">{icons.map(kind => <div key={kind}><span className="workspace-icon"><ProductIcon kind={kind}/></span><ProductIcon kind={kind}/><span>{kind}</span></div>)}</section>
    <section className="spectral-lab-controls"><button className="primary-button"><ProductIcon kind="learn"/>开始学习</button><label className="search-box"><ProductIcon kind="concepts"/><input placeholder="搜索知识" aria-label="测试搜索输入"/></label></section>
  </div>;
}
