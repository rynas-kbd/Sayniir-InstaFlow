'use client'

import { useEffect, useRef } from 'react'

export function WebGLShaderBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      // Simplex-like noise helper
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec2 mouse = u_mouse / u_resolution.xy;
        mouse.x *= u_resolution.x / u_resolution.y;

        float dist = distance(st, mouse);
        float mouseGlow = smoothstep(0.45, 0.0, dist) * 0.35;

        // Dynamic fluid wave distortion
        vec2 q = vec2(0.0);
        q.x = snoise(st + 0.05 * u_time);
        q.y = snoise(st + vec2(1.0));

        vec2 r = vec2(0.0);
        r.x = snoise(st + 1.0 * q + vec2(1.7, 9.2) + 0.08 * u_time);
        r.y = snoise(st + 1.0 * q + vec2(8.3, 2.8) + 0.06 * u_time);

        float f = snoise(st + r + 0.04 * u_time);

        // Organic color palette: Warm Terracotta (#C85A32), Soft Gold, Sage Teal, Muted Dark Ambient
        vec3 color1 = vec3(0.784, 0.352, 0.196); // Terracotta #C85A32
        vec3 color2 = vec3(0.22, 0.35, 0.30);    // Sage #38594D
        vec3 color3 = vec3(0.07, 0.07, 0.09);    // Dark base #121217

        vec3 color = mix(color3, color1, clamp(f * f * 2.2 + mouseGlow, 0.0, 1.0));
        color = mix(color, color2, clamp(length(q) * 0.4, 0.0, 1.0));

        // Subtile noise film grain overlay
        float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.04;

        gl_FragColor = vec4(color + grain, 0.28);
      }
    `

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type)
      if (!shader) return null
      glCtx.shaderSource(shader, source)
      glCtx.compileShader(shader)
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error(glCtx.getShaderInfoLog(shader))
        glCtx.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      return
    }

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse')
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time')

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    )

    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX
      targetMouseY = window.innerHeight - e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)

    let animationFrameId: number
    const startTime = performance.now()

    const resize = () => {
      const displayWidth = window.innerWidth
      const displayHeight = window.innerHeight
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth
        canvas.height = displayHeight
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
    }

    const render = () => {
      resize()

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      gl.useProgram(program)

      gl.enableVertexAttribArray(positionAttributeLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseUniformLocation, mouseX, mouseY)
      gl.uniform1f(timeUniformLocation, (performance.now() - startTime) * 0.001)

      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[-1] size-full opacity-60 transition-opacity duration-1000"
      style={{ filter: 'blur(30px)' }}
    />
  )
}
