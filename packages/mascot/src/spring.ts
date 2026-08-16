import { useEffect, useMemo, useRef, useState } from "react";
import {
  type MascotMood,
  type MascotShape,
  packMascot,
  unpackMascot,
} from "./geometry.js";

const STIFFNESS = 170;
const DAMPING = 21;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useMascotMorph(shape: MascotShape, mood: MascotMood) {
  const target = useMemo(() => packMascot(shape, mood), [shape, mood]);
  const current = useRef<number[]>([]);
  if (current.current.length === 0) current.current = target.slice();
  const velocity = useRef<number[]>(target.map(() => 0));
  const [, setTick] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      current.current = target.slice();
      velocity.current = target.map(() => 0);
      setTick((tick) => tick + 1);
      return;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.024, (now - last) / 1000);
      last = now;
      const from = current.current;
      const vel = velocity.current;
      if (from.length !== target.length) {
        current.current = target.slice();
        velocity.current = target.map(() => 0);
        setTick((value) => value + 1);
        return;
      }
      let moving = false;
      for (let i = 0; i < target.length; i++) {
        const dest = target[i] ?? 0;
        const here = from[i] ?? 0;
        const delta = dest - here;
        const nextVel = (vel[i] ?? 0) + delta * STIFFNESS * dt;
        const damped = nextVel * Math.exp(-DAMPING * dt);
        vel[i] = damped;
        from[i] = here + damped * dt;
        if (Math.abs(delta) > 0.04 || Math.abs(damped) > 0.05) moving = true;
      }
      setTick((value) => value + 1);
      if (moving) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return unpackMascot(current.current);
}
