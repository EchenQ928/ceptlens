// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vitest';
import { PlatformPreview } from './PlatformPreview';

it('pauses without reloading an answer and restores pause when a new viewport becomes ready', async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<PlatformPreview path="/learn/questions/test" kind="questions"/>));
    const frame = host.querySelector('iframe')!;
    const src = frame.src;
    const send = vi.spyOn(frame.contentWindow!, 'postMessage');
    const pause = [...host.querySelectorAll('button')].find(el=>el.textContent?.includes('暂停背景'))!;
    await act(() => pause.click());
    expect(frame.src).toBe(src);
    expect(send).toHaveBeenCalledWith({ type:'ceptlens-preview-pause',paused:true },window.location.origin);
    await act(() => [...host.querySelectorAll('button')].find(el=>el.textContent==='390px')!.click());
    const newFrame = host.querySelector('iframe')!;
    const resend = vi.spyOn(newFrame.contentWindow!, 'postMessage');
    await act(() => window.dispatchEvent(new MessageEvent('message',{ origin:window.location.origin,source:newFrame.contentWindow,data:{type:'ceptlens-preview-ready'} })));
    expect(resend).toHaveBeenCalledWith({ type:'ceptlens-preview-pause',paused:true },window.location.origin);
    resend.mockClear();
    await act(() => window.dispatchEvent(new MessageEvent('message',{ origin:'https://unrelated.example',source:newFrame.contentWindow,data:{type:'ceptlens-preview-ready'} })));
    expect(resend).not.toHaveBeenCalled();
  } finally { await act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); }
});
