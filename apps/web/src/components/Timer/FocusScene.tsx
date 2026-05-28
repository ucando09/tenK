/**
 * FocusScene — fullscreen animated CSS background for focus mode.
 *
 * Each scene is pure CSS (gradients + keyframes), no image assets.
 * Renders OPAQUE so the timer running underneath doesn't bleed through.
 *
 * If you want a denser look later, drop a darkened still image into
 * `public/scenes/<id>.jpg` and add it as `background-image` on top
 * of the gradient.
 */
import type { SceneId } from '../../lib/constants';

export type VisualStyle = 'simple' | 'realism';

interface FocusSceneProps {
  scene:       SceneId;
  visualStyle: VisualStyle;
}

export function FocusScene({ scene, visualStyle }: FocusSceneProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* CSS scene — always present as the base layer and realism fallback */}
      {SCENE_LAYERS[scene]}

      {/* Realism mode: looping video over the CSS base.
          Silently hides itself on a 404 / load error so the CSS scene
          shows through — no config needed, just drop a file in public/video/. */}
      {visualStyle === 'realism' && (
        <video
          key={scene}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
        >
          <source src={`/video/${scene}.mp4`}  type="video/mp4"  />
          <source src={`/video/${scene}.webm`} type="video/webm" />
        </video>
      )}

      {/* Extra darken in realism mode so the timer stays readable over live footage */}
      {visualStyle === 'realism' && (
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.32)' }} />
      )}

      {/* Universal vignette — deepens edges on both modes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <SceneStyles />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 *  Scene renderers — each composes 2-4 absolutely-positioned layers
 *  ──────────────────────────────────────────────────────────────────── */

const SCENE_LAYERS: Record<SceneId, React.ReactNode> = {
  darkroom: (
    <>
      <div className="absolute inset-0 bg-[#0a0810]" />
      {/* Single candle glow, top-center */}
      <div
        className="absolute"
        style={{
          left:   '50%',
          top:    '12%',
          width:  '480px',
          height: '480px',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,180,90,0.18) 0%, transparent 70%)',
          animation:  'flicker 4s ease-in-out infinite',
        }}
      />
    </>
  ),

  fireplace: (
    <>
      {/* Base wall */}
      <div className="absolute inset-0 bg-[#1a0808]" />
      {/* Hot core */}
      <div
        className="absolute"
        style={{
          left:   '50%',
          bottom: '-150px',
          width:  '900px',
          height: '600px',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse at center bottom, rgba(255,160,40,0.55) 0%, rgba(220,60,20,0.35) 25%, rgba(120,20,10,0.15) 55%, transparent 80%)',
          animation: 'fire-flicker 2.2s ease-in-out infinite',
          filter:    'blur(2px)',
        }}
      />
      {/* Secondary ember glow */}
      <div
        className="absolute"
        style={{
          left:   '50%',
          bottom: '-50px',
          width:  '500px',
          height: '300px',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse at center, rgba(255,200,80,0.45) 0%, transparent 60%)',
          animation: 'fire-flicker 1.4s ease-in-out infinite reverse',
          filter:    'blur(3px)',
        }}
      />
      {/* Ambient room glow on the walls */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 110%, rgba(255,120,30,0.18) 0%, transparent 50%)',
        }}
      />
    </>
  ),

  library: (
    <>
      <div className="absolute inset-0 bg-[#1a1308]" />
      {/* Warm amber lamp pool */}
      <div
        className="absolute"
        style={{
          left:   '70%',
          top:    '20%',
          width:  '700px',
          height: '700px',
          transform: 'translate(-50%,-50%)',
          background:
            'radial-gradient(circle, rgba(255,180,80,0.30) 0%, rgba(200,130,50,0.10) 40%, transparent 70%)',
          filter: 'blur(1px)',
        }}
      />
      {/* Subtle wood-grain horizontal banding */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 60px, rgba(80,40,10,0.18) 60px, rgba(80,40,10,0.18) 62px)',
        }}
      />
    </>
  ),

  forest: (
    <>
      <div className="absolute inset-0 bg-[#06120a]" />
      {/* Moonlit clearing */}
      <div
        className="absolute"
        style={{
          left:   '30%',
          top:    '15%',
          width:  '900px',
          height: '900px',
          transform: 'translate(-50%,-50%)',
          background:
            'radial-gradient(circle, rgba(170,210,180,0.18) 0%, rgba(80,150,110,0.08) 35%, transparent 65%)',
        }}
      />
      {/* Vertical tree-trunk shadows */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'repeating-linear-gradient(90deg, transparent 0px, transparent 90px, rgba(0,15,5,0.55) 90px, rgba(0,15,5,0.55) 110px)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
        }}
      />
    </>
  ),

  cafe: (
    <>
      <div className="absolute inset-0 bg-[#181006]" />
      {/* Window light from upper-left */}
      <div
        className="absolute"
        style={{
          left:   '20%',
          top:    '20%',
          width:  '800px',
          height: '800px',
          transform: 'translate(-50%,-50%)',
          background:
            'radial-gradient(circle, rgba(255,200,140,0.22) 0%, rgba(180,120,80,0.10) 40%, transparent 70%)',
        }}
      />
      {/* Faint bokeh dots — distant lights */}
      <BokehDots />
    </>
  ),

  rain: (
    <>
      <div className="absolute inset-0 bg-[#0a1018]" />
      {/* Cool blue ambient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(80,140,200,0.18) 0%, transparent 60%)',
        }}
      />
      {/* Animated rain streaks */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          background:
            'repeating-linear-gradient(105deg, transparent 0px, transparent 30px, rgba(180,210,240,0.4) 30px, rgba(180,210,240,0.4) 31px)',
          animation: 'rain-fall 0.9s linear infinite',
        }}
      />
    </>
  ),

  'lofi-night': (
    <>
      <div className="absolute inset-0 bg-[#0a0820]" />
      {/* City glow on horizon */}
      <div
        className="absolute"
        style={{
          left:   '50%',
          bottom: '-200px',
          width:  '1400px',
          height: '600px',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse at center bottom, rgba(124,108,240,0.30) 0%, rgba(180,80,200,0.15) 40%, transparent 70%)',
        }}
      />
      {/* Slow purple aurora */}
      <div
        className="absolute"
        style={{
          left:   '10%',
          top:    '10%',
          width:  '700px',
          height: '500px',
          background:
            'radial-gradient(ellipse, rgba(140,90,220,0.22) 0%, transparent 70%)',
          animation: 'aurora 18s ease-in-out infinite',
          filter:    'blur(20px)',
        }}
      />
      <BokehDots />
    </>
  ),

  'interstellar': (
    <>
      {/* Deep space — near-black with a hint of blue */}
      <div className="absolute inset-0 bg-[#020408]" />
      {/* Nebula wisps — upper right */}
      <div
        className="absolute"
        style={{
          right:  '-5%',
          top:    '-5%',
          width:  '70%',
          height: '60%',
          background: 'radial-gradient(ellipse, rgba(30,55,120,0.16) 0%, rgba(55,20,80,0.08) 55%, transparent 75%)',
          filter: 'blur(50px)',
        }}
      />
      {/* Nebula wisps — lower left */}
      <div
        className="absolute"
        style={{
          left:   '-10%',
          bottom: '10%',
          width:  '50%',
          height: '40%',
          background: 'radial-gradient(ellipse, rgba(20,40,90,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Accretion disk — outer amber corona */}
      <div
        className="absolute"
        style={{
          left:      '50%',
          top:       '36%',
          width:     '580px',
          height:    '180px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(ellipse, rgba(210,130,40,0.22) 0%, rgba(160,70,15,0.10) 55%, transparent 75%)',
          filter:    'blur(14px)',
          animation: 'accretion-pulse 8s ease-in-out infinite',
        }}
      />
      {/* Accretion disk — bright inner band */}
      <div
        className="absolute"
        style={{
          left:      '50%',
          top:       '36%',
          width:     '280px',
          height:    '60px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(ellipse, rgba(255,195,90,0.62) 0%, rgba(220,130,35,0.40) 35%, transparent 65%)',
          filter:    'blur(4px)',
          animation: 'accretion-pulse 8s ease-in-out infinite',
        }}
      />
      {/* Gravitational lensing — ghost arc bent above the hole */}
      <div
        className="absolute"
        style={{
          left:      '50%',
          top:       '36%',
          width:     '180px',
          height:    '90px',
          transform: 'translate(-50%, -94%)',
          background: 'radial-gradient(ellipse at center 80%, rgba(255,210,120,0.38) 0%, transparent 60%)',
          filter:    'blur(8px)',
          animation: 'accretion-pulse 8s ease-in-out infinite reverse',
        }}
      />
      {/* Black hole silhouette */}
      <div
        className="absolute rounded-full"
        style={{
          left:            '50%',
          top:             '36%',
          width:           '110px',
          height:          '110px',
          transform:       'translate(-50%, -50%)',
          backgroundColor: '#000',
          boxShadow:       '0 0 80px rgba(180,100,20,0.20)',
        }}
      />
      <InterstellarStars />
    </>
  ),

  'minecraft': (
    <>
      {/* Deep night sky */}
      <div className="absolute inset-0 bg-[#0a0f1c]" />
      {/* Blocky moon — square, no border-radius */}
      <div
        className="absolute"
        style={{
          right:           '18%',
          top:             '10%',
          width:           '52px',
          height:          '52px',
          backgroundColor: '#ffffcc',
          boxShadow:       '0 0 60px rgba(255,255,180,0.28)',
        }}
      />
      {/* Pixel stars */}
      <PixelStars />
      {/* Faint green horizon glow — hints at the grassy overworld below */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height:     '140px',
          background: 'linear-gradient(to top, rgba(40,100,30,0.22) 0%, transparent 100%)',
        }}
      />
    </>
  ),
};

/* Reusable: soft circular star field for the Interstellar scene */
function InterstellarStars() {
  const stars = [
    { left: '3%',  top: '5%',   size: 1.5 }, { left: '8%',  top: '13%',  size: 1   },
    { left: '14%', top: '7%',   size: 2   }, { left: '19%', top: '21%',  size: 1   },
    { left: '27%', top: '4%',   size: 1.5 }, { left: '33%', top: '16%',  size: 1   },
    { left: '40%', top: '9%',   size: 2   }, { left: '52%', top: '3%',   size: 1   },
    { left: '61%', top: '12%',  size: 1.5 }, { left: '68%', top: '6%',   size: 1   },
    { left: '74%', top: '19%',  size: 2   }, { left: '82%', top: '10%',  size: 1   },
    { left: '88%', top: '5%',   size: 1.5 }, { left: '94%', top: '16%',  size: 1   },
    { left: '6%',  top: '31%',  size: 1   }, { left: '11%', top: '39%',  size: 2   },
    { left: '17%', top: '26%',  size: 1   }, { left: '23%', top: '34%',  size: 1.5 },
    { left: '29%', top: '29%',  size: 1   }, { left: '36%', top: '23%',  size: 2   },
    { left: '44%', top: '20%',  size: 1   }, { left: '57%', top: '25%',  size: 1.5 },
    { left: '63%', top: '31%',  size: 1   }, { left: '71%', top: '27%',  size: 2   },
    { left: '78%', top: '22%',  size: 1   }, { left: '85%', top: '34%',  size: 1   },
    { left: '91%', top: '28%',  size: 1.5 }, { left: '97%', top: '21%',  size: 1   },
    { left: '2%',  top: '66%',  size: 1   }, { left: '9%',  top: '73%',  size: 1.5 },
    { left: '16%', top: '69%',  size: 1   }, { left: '24%', top: '76%',  size: 2   },
    { left: '32%', top: '71%',  size: 1   }, { left: '42%', top: '79%',  size: 1   },
    { left: '55%', top: '74%',  size: 1.5 }, { left: '65%', top: '81%',  size: 1   },
    { left: '76%', top: '77%',  size: 2   }, { left: '84%', top: '69%',  size: 1   },
    { left: '93%', top: '76%',  size: 1.5 }, { left: '48%', top: '89%',  size: 1   },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left:            s.left,
            top:             s.top,
            width:           `${s.size}px`,
            height:          `${s.size}px`,
            backgroundColor: 'rgba(255,255,255,0.85)',
            animation:       `star-twinkle ${3.5 + i * 0.22}s ease-in-out infinite`,
          }}
        />
      ))}
    </>
  );
}

/* Reusable: sharp pixel-style stars for the Minecraft scene */
function PixelStars() {
  const stars = [
    { left: '8%',  top: '8%',  size: 3 }, { left: '22%', top: '14%', size: 2 },
    { left: '45%', top: '6%',  size: 3 }, { left: '60%', top: '17%', size: 2 },
    { left: '75%', top: '7%',  size: 2 }, { left: '35%', top: '24%', size: 2 },
    { left: '12%', top: '29%', size: 2 }, { left: '55%', top: '30%', size: 2 },
    { left: '80%', top: '34%', size: 3 }, { left: '28%', top: '40%', size: 2 },
    { left: '68%', top: '11%', size: 2 }, { left: '90%', top: '22%', size: 2 },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left:            s.left,
            top:             s.top,
            width:           s.size,
            height:          s.size,
            backgroundColor: 'rgba(255,255,255,0.90)',
            animation:       `star-twinkle ${3 + i * 0.35}s ease-in-out infinite`,
          }}
        />
      ))}
    </>
  );
}

/* Reusable: scattered bokeh dots for cafe + lofi scenes */
function BokehDots() {
  const dots = [
    { left: '10%', top: '30%', size: 8,  color: 'rgba(255,200,140,0.45)' },
    { left: '85%', top: '20%', size: 6,  color: 'rgba(180,220,255,0.40)' },
    { left: '70%', top: '75%', size: 10, color: 'rgba(255,180,120,0.40)' },
    { left: '20%', top: '70%', size: 5,  color: 'rgba(220,180,255,0.40)' },
    { left: '50%', top: '50%', size: 7,  color: 'rgba(255,220,160,0.30)' },
    { left: '35%', top: '15%', size: 4,  color: 'rgba(180,160,255,0.45)' },
  ];
  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left:        d.left,
            top:         d.top,
            width:       d.size * 4,
            height:      d.size * 4,
            background:  `radial-gradient(circle, ${d.color} 0%, transparent 70%)`,
            filter:      'blur(2px)',
            animation:   `bokeh-pulse ${4 + i * 0.7}s ease-in-out infinite`,
          }}
        />
      ))}
    </>
  );
}

/* All keyframes for the scenes live here so they're scoped + tree-shaken */
function SceneStyles() {
  return (
    <style>{`
      @keyframes flicker {
        0%, 100% { opacity: 1;    transform: translateX(-50%) scale(1);    }
        45%      { opacity: 0.78; transform: translateX(-50%) scale(1.03); }
        65%      { opacity: 0.92; transform: translateX(-50%) scale(0.98); }
      }
      @keyframes fire-flicker {
        0%, 100% { opacity: 1;    transform: translateX(-50%) scaleY(1)    scaleX(1);    }
        25%      { opacity: 0.85; transform: translateX(-50%) scaleY(1.08) scaleX(0.96); }
        50%      { opacity: 0.95; transform: translateX(-50%) scaleY(0.94) scaleX(1.04); }
        75%      { opacity: 0.88; transform: translateX(-50%) scaleY(1.05) scaleX(0.98); }
      }
      @keyframes rain-fall {
        from { background-position: 0 0;    }
        to   { background-position: 60px 200px; }
      }
      @keyframes aurora {
        0%, 100% { transform: translate(0, 0)        scale(1);    opacity: 0.7; }
        50%      { transform: translate(80px, 30px)  scale(1.15); opacity: 1;   }
      }
      @keyframes bokeh-pulse {
        0%, 100% { opacity: 0.4; transform: scale(1);    }
        50%      { opacity: 0.9; transform: scale(1.15); }
      }
      @keyframes star-twinkle {
        0%, 100% { opacity: 0.9; }
        50%      { opacity: 0.2; }
      }
      @keyframes accretion-pulse {
        0%, 100% { opacity: 1;    }
        50%      { opacity: 0.68; }
      }
    `}</style>
  );
}
