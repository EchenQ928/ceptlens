/** CeptLens original spectral composition. Time is periodic; grain is screen-locked. */
export const SPECTRAL_PERIOD = 16;
export const spectralFragmentShader = /* glsl */ `#version 300 es
precision highp float;
uniform mediump float u_time;
uniform mediump vec2 u_resolution;
uniform mediump float u_pixelRatio;
uniform float u_workspace;
uniform float u_intensity;
uniform float u_tone;
uniform vec2 u_pointer;
out vec4 fragColor;
const float TAU = 6.28318530718;
float bell(float d, float width) { return exp(-d*d/(width*width)); }
float grain(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(.06711056,.00583715)))); }
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1. - uv.y;
  float phase = TAU * u_time / 16.;
  vec2 q = uv - u_pointer;
  // Preserve a wide composition when the viewport is tall or narrow.
  float aspect = u_resolution.x / u_resolution.y;
  q.x = (q.x - .69) * max(1., aspect / 1.85) + .69;
  q.x += .035 * sin(q.y * 5.2 + .45 * sin(phase));
  q.y += .025 * sin(q.x * 6. + .5 * cos(phase));
  float x = q.x;
  float y = q.y;
  float fold = .96 - .77 * x + .115 * sin(x * 6.2 + .24*sin(phase));
  fold += .026 * sin(phase + x*3.);
  float d = y - fold;
  float open = smoothstep(.2, .66, x);
  float focus = .85 + .15 * sin(phase + .8);
  vec3 color = vec3(.025,.038,.065);
  // Distant indigo and cyan illumination, visible before the first fold.
  color += vec3(.058,.036,.12) * bell(y - .16 + .11*x, .36) * smoothstep(.27,.9,x);
  color += vec3(.01,.12,.17) * bell(y - .09, .24) * bell(x-.97,.28);
  // A broad frosted ribbon with a warmer, partially occluded upper lip.
  vec3 ribbon = vec3(.04,.19,.53) * bell(d-.09,.17);
  ribbon += vec3(.07,.34,.41) * bell(d-.055,.075);
  ribbon += vec3(.30,.27,.50) * bell(d+.023,.064);
  ribbon += vec3(.35,.40,.38) * bell(d+.006,.026) * focus;
  ribbon += vec3(.66,.26,.105) * bell(d+.052,.037) * bell(x-.72,.17);
  ribbon += vec3(.12,.17,.23) * bell(d+.013,.007) * bell(x-.88,.24);
  // Optical diffusion surrounds a crisp-to-soft material edge.
  ribbon += vec3(.06,.09,.21) * bell(d,.255);
  color += ribbon * open;
  float lower = y - (fold + .36 + .06 * sin(x*4. - .28*cos(phase)));
  vec3 second = vec3(.07,.09,.27)*bell(lower-.03,.15);
  second += vec3(.11,.25,.32)*bell(lower,.053);
  second += vec3(.21,.23,.29)*bell(lower+.013,.021);
  second += vec3(.38,.17,.12)*bell(lower+.045,.05)*bell(x-1.02,.2);
  color += second * smoothstep(.18,.78,x);
  // A low-contrast foreground veil creates a third plane without another object.
  color *= 1. - .32*bell(d-.24,.075)*open;
  float vignette = 1. - .22*pow(length((uv-.5)*vec2(.8,1.)),2.);
  color *= vignette;
  // Workspace light remains at the perimeter, behind opaque reading surfaces.
  float side = pow(abs(uv.x-.5)*2.,2.);
  float crown = .7*(1.-smoothstep(.05,.55,uv.y));
  float perimeter = clamp(.22 + .6*side + crown,0.,1.);
  vec3 workspace = mix(vec3(.025,.038,.065),color,perimeter*.67);
  workspace += vec3(.018,.10,.14)*bell(uv.x-.08,.19)*bell(uv.y-.24,.47);
  workspace += vec3(.08,.048,.14)*bell(uv.x-.94,.24)*bell(uv.y-.51,.5);
  color = mix(color,workspace,u_workspace);
  // Subtle route tint: amber for assessment, violet for concepts.
  color += u_tone * vec3(.035,-.009,.035) * max(color.r,color.b);
  color = mix(vec3(.025,.038,.065),color,u_intensity);
  color = 1. - exp(-color * 1.14);
  float n = grain(gl_FragCoord.xy / max(1.,u_pixelRatio));
  color += (n-.5) * (.021 + .055 * smoothstep(.05,.5,max(color.r,max(color.g,color.b))));
  fragColor = vec4(clamp(color,0.,1.),1.);
}`;
