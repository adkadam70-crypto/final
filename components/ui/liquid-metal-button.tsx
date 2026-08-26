'use client'

import { liquidMetalFragmentShader, ShaderMount } from '@paper-design/shaders'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface LiquidMetalButtonProps {
  label?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Stretch to the width of its container instead of the fixed intrinsic size. */
  fullWidth?: boolean
}

let styleInjected = false

export function LiquidMetalButton({ label = 'Get Started', onClick, type = 'button', disabled, fullWidth }: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const shaderRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderMount = useRef<any>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rippleId = useRef(0)

  const dimensions = useMemo(
    () => ({ width: 142, height: 46, innerWidth: 138, innerHeight: 42, shaderWidth: 142, shaderHeight: 46 }),
    [],
  )

  useEffect(() => {
    if (!styleInjected) {
      styleInjected = true
      const style = document.createElement('style')
      style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    if (shaderRef.current) {
      // WebGL2 can legitimately be unavailable (older GPUs/drivers, some
      // mobile browsers, privacy settings) — ShaderMount throws
      // synchronously when it is. This is a purely decorative effect, so a
      // failure here must never take the rest of the page down with it.
      try {
        shaderMount.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          0.6,
        )
      } catch (err) {
        console.error('LiquidMetalButton: shader unavailable, falling back to plain button.', err)
        shaderMount.current = null
      }
    }

    return () => {
      try {
        shaderMount.current?.destroy?.()
      } catch {
        // already torn down or never initialized — nothing to clean up
      }
      shaderMount.current = null
    }
  }, [])

  function handleMouseEnter() {
    setIsHovered(true)
    shaderMount.current?.setSpeed?.(1)
  }

  function handleMouseLeave() {
    setIsHovered(false)
    setIsPressed(false)
    shaderMount.current?.setSpeed?.(0.6)
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4)
      setTimeout(() => shaderMount.current?.setSpeed?.(isHovered ? 1 : 0.6), 300)
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ }
      setRipples((prev) => [...prev, ripple])
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600)
    }
    onClick?.()
  }

  const w = fullWidth ? '100%' : `${dimensions.width}px`

  return (
    <div className="relative inline-block" style={fullWidth ? { width: '100%' } : undefined}>
      <div style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}>
        <div
          style={{
            position: 'relative',
            width: w,
            height: `${dimensions.height}px`,
            transformStyle: 'preserve-3d',
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d',
              transform: 'translateZ(20px)',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#e5e5e5',
                fontWeight: 500,
                textShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: `translateZ(10px) ${isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)'}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: fullWidth ? 'calc(100% - 4px)' : `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: '2px',
                borderRadius: '100px',
                background: 'linear-gradient(180deg, #202020 0%, #000000 100%)',
                boxShadow: isPressed ? 'inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: `translateZ(0px) ${isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)'}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: '100%',
                borderRadius: '100px',
                boxShadow: isPressed
                  ? '0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
                  : isHovered
                    ? '0px 0px 0px 1px var(--primary), 0px 12px 20px -4px color-mix(in oklab, var(--primary) 35%, transparent), 0px 4px 4px 0px rgba(0, 0, 0, 0.15)'
                    : '0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{ borderRadius: '100px', overflow: 'hidden', position: 'relative', width: '100%', height: `${dimensions.shaderHeight}px` }}
              />
            </div>
          </div>

          <button
            ref={buttonRef}
            type={type}
            disabled={disabled}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              outline: 'none',
              zIndex: 40,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(25px)',
              overflow: 'hidden',
              borderRadius: '100px',
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: 'absolute',
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)',
                  pointerEvents: 'none',
                  animation: 'ripple-animation 0.6s ease-out',
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  )
}
