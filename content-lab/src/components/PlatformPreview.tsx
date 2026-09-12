import { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Pause, Play, Maximize2, Minimize2 } from 'lucide-react';
import { LiquidSelection } from './LiquidSelection';
import { uiText, useLocale } from '../i18n';

/** A real viewport, not a scaled screenshot: package CSS media queries run inside the frame. */
export function PlatformPreview({ path, kind }: { path: string; kind: 'questions' | 'terms' }) {
  const { locale } = useLocale();
  const [viewport, setViewport] = useState('desktop');
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('practice');
  const frame = useRef<HTMLIFrameElement>(null);
  const sendPause = () => frame.current?.contentWindow?.postMessage({ type: 'ceptlens-preview-pause', paused }, window.location.origin);
  useEffect(sendPause, [paused]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    const message = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'ceptlens-preview-escape') setExpanded(false);
      if (event.data?.type === 'ceptlens-preview-ready') sendPause();
    };
    window.addEventListener('keydown', close); window.addEventListener('message', message);
    return () => { window.removeEventListener('keydown', close); window.removeEventListener('message', message); };
  }, [paused]);
  const t = (zh: string,en: string) => uiText(locale,zh,en);
  return <section className={`lab-preview ${expanded ? 'is-expanded' : ''}`}>
    <div className="lab-preview-controls"><strong>{t('平台预览','Platform preview')}</strong>
      <LiquidSelection value={viewport} className="mode-segment" label={t('预览尺寸','Preview size')}>
        <button aria-pressed={viewport === 'desktop'} onClick={()=>setViewport('desktop')}><Monitor size={16}/>{t('桌面','Desktop')}</button>
        <button aria-pressed={viewport === 'mobile'} onClick={()=>setViewport('mobile')}><Smartphone size={16}/>390px</button>
      </LiquidSelection>
      {kind === 'questions' && <LiquidSelection value={mode} className="mode-segment" label={t('学习模式','Study mode')}>
        <button aria-pressed={mode === 'practice'} onClick={()=>setMode('practice')}>{t('试答','Practice')}</button>
        <button aria-pressed={mode === 'quick'} onClick={()=>setMode('quick')}>{t('阅读','Read')}</button>
      </LiquidSelection>}
      <button className="secondary-button" aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused ? <Play size={16}/> : <Pause size={16}/>} {paused?t('播放背景','Play background'):t('暂停背景','Pause background')}</button>
      <button className="secondary-button" aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {expanded?t('退出展开','Collapse preview'):t('展开预览','Expand preview')}</button>
    </div>
    <div className={`lab-preview-stage ${viewport === 'mobile' ? 'is-mobile' : ''}`}>
      <iframe ref={frame} onLoad={sendPause} key={`${viewport}-${locale}`} title={t('正式平台样式预览','Platform style preview')} src={`?preview=1#${path}${kind === 'questions' ? '?mode='+mode : ''}`}/>
    </div>
  </section>;
}
