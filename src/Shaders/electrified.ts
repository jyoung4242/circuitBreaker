export const electrified = `#version 300 es
precision mediump float;

// Lightning parameters
const float speed = 0.5;
const float intensity = 0.70;
const float branches = 2.;

// color constants
const vec3 boltColor = vec3(0.99, 0.99, 1.0);
const vec3 glowColor = vec3(0.44, 0.66, 1.0);

uniform vec2 u_resolution;
uniform float u_time_ms;
uniform float u_opacity;
uniform sampler2D u_graphic; // background sprite texture 
uniform bool u_isEnergized;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float lightning(vec2 uv, float t, float offset) {
    vec2 p = uv;
    p.x += sin(p.y * branches + t * speed + offset) * 0.2;
    p.x += noise(p * 10.0 + t * 2.0) * 0.1;
    float d = abs(p.x);
    float bolt = 0.02 / (d + 0.02);
    bolt *= smoothstep(1.0, 0.0, abs(uv.y));
    return bolt;
}

void main() {
    
    // Normalize UVs
    vec2 uv = v_uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    float t = u_time_ms;

    // --- Sample background texture first ---
    vec3 baseColor = texture(u_graphic, v_uv).rgb;
    if(!u_isEnergized)
    {
        fragColor = vec4(baseColor, u_opacity); 
        return;
    }
    
    
    // --- Compute lightning ---
    float bolts = 0.0;
    bolts += lightning(uv, t, 0.0) * step(0.7, fract(t * 0.3));
    bolts += lightning(uv * 0.8 + vec2(0.3, 0.0), t * 1.2, 1.0) * step(0.8, fract(t * 0.4 + 0.5));
    bolts += lightning(uv * 0.9 - vec2(0.2, 0.0), t * 0.9, 2.0) * step(0.75, fract(t * 0.35 + 0.25));
    bolts *= intensity;

    float glow = bolts * 0.3 + exp(-length(uv) * 2.0) * 0.1 * (sin(t * 5.0) * 0.5 + 0.5);

    // --- Combine lightning with background ---
    vec3 lightningColor = glowColor * glow + boltColor * bolts;
    lightningColor += vec3(max(0.0, bolts - 0.5) * 0.3);

    vec3 finalColor = baseColor + lightningColor; // superimpose

    // Clamp to 0..1 to avoid over-brightening
    fragColor = vec4(clamp(finalColor, 0.0, 1.0), u_opacity);
}
`;
