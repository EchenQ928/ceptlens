import { ShaderMount } from "@paper-design/shaders";
import { spectralFragmentShader } from "./spectralShader";
import { spectralPresets, type SpectralPreset } from "./motionPolicy";
import { emptyLiquidUniforms, liquidShaderUniforms } from "./liquidScene";

/** Only this module imports WebGL. It is loaded after the immediately available poster. */
export function createSpectralRenderer(element: HTMLElement, preset: SpectralPreset, mobile: boolean) {
  const params = spectralPresets[preset];
  const renderer = new ShaderMount(element, spectralFragmentShader, {
    ...liquidShaderUniforms(emptyLiquidUniforms()), u_workspace: params.workspace, u_intensity: params.intensity, u_tone: params.tone, u_pointer: [0, 0]
  }, { alpha: false, antialias: false, powerPreference: "low-power", preserveDrawingBuffer: import.meta.env.DEV }, 0, 0, 1, mobile ? 480000 : 2000000);
  if (import.meta.env.DEV) {
    const gl = renderer.canvasElement.getContext('webgl2');
    const program = gl?.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;
    if (gl && program) renderer.canvasElement.dataset.uniforms = Array.from({ length: gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS) as number }, (_,i) => gl.getActiveUniform(program,i)?.name).join(',');
  }
  return renderer;
}
