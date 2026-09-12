# Third-party notices

## Liquid Glass Studio

The curved-edge refraction calculation in `src/components/spectral/spectralShader.ts`
is adapted from `iyinchao/liquid-glass-studio`, `src/shaders/fragment-main.glsl`.
The velocity-to-deformation design in `LiquidSelection` also draws on that project's
spring controller. Source: https://github.com/iyinchao/liquid-glass-studio

MIT License, Copyright (c) 2024 Charles Yin. The full license is distributed in
`public/spectral/LIQUID-GLASS-LICENSE.txt`. No upstream photographs, videos, sample
backgrounds, UI controls or application bundle are included.

## Paper Shaders

The spectral renderer uses `ShaderMount` from `@paper-design/shaders` 0.0.80 (Apache-2.0).
Source: https://github.com/paper-design/shaders
Copyright 2026 Paper. The original LICENSE and NOTICE are retained in
`public/spectral/PAPER-LICENSE.txt` and `public/spectral/PAPER-NOTICE.txt`.
CeptLens's spectral composition and SVG icon paths are original application code.

## Magic UI

`FlowLink` in `src/components/AuraPrimitives.tsx` and its styling adapt the expanding-fill and translating-label pattern in Magic UI's Interactive Hover Button. Source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/interactive-hover-button.tsx

MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Other dependencies retain their package licenses. Noto Sans SC's OFL license is included at `public/fonts/NotoSansSC-LICENSE.txt`.
