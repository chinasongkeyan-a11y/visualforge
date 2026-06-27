import type { RenderCtx, CanvasInfo } from './context';
import type { TransitionType } from '../types';
import { clamp01, EASINGS } from '../easing';

/** Transition duration in seconds */
export const TRANSITION_DURATION = 0.4;

interface TransitionState {
  alpha: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

/** Compute transition transform for a segment at a given local time */
export function computeTransition(
  localTime: number,
  duration: number,
  transitionIn: TransitionType,
  transitionOut: TransitionType,
  canvas: CanvasInfo,
): TransitionState {
  const state: TransitionState = { alpha: 1, offsetX: 0, offsetY: 0, scale: 1 };
  const transDur = Math.min(TRANSITION_DURATION, duration / 3);

  // In transition (first transDur seconds)
  if (localTime < transDur && transitionIn !== 'none') {
    const t = clamp01(localTime / transDur);
    const eased = EASINGS.easeOut(t);
    applyTransitionIn(state, transitionIn, eased, canvas);
  }

  // Out transition (last transDur seconds)
  const outStart = duration - transDur;
  if (localTime > outStart && transitionOut !== 'none') {
    const t = clamp01((localTime - outStart) / transDur);
    const eased = EASINGS.easeIn(t);
    applyTransitionOut(state, transitionOut, eased, canvas);
  }

  return state;
}

function applyTransitionIn(
  state: TransitionState,
  type: TransitionType,
  t: number,
  canvas: CanvasInfo,
): void {
  switch (type) {
    case 'fadeIn':
      state.alpha = t;
      break;
    case 'slideUp':
      state.alpha = t;
      state.offsetY = canvas.height * 0.08 * (1 - t);
      break;
    case 'scaleIn':
      state.alpha = t;
      state.scale = 0.85 + 0.15 * t;
      break;
    default:
      break;
  }
}

function applyTransitionOut(
  state: TransitionState,
  type: TransitionType,
  t: number,
  canvas: CanvasInfo,
): void {
  switch (type) {
    case 'fadeOut':
      state.alpha = 1 - t;
      break;
    case 'slideOut':
      state.alpha = 1 - t;
      state.offsetY = canvas.height * 0.08 * t;
      break;
    case 'scaleOut':
      state.alpha = 1 - t;
      state.scale = 1 - 0.15 * t;
      break;
    default:
      break;
  }
}

/** Apply transition state to the context (save/translate/scale/alpha) */
export function applyTransitionState(ctx: RenderCtx, state: TransitionState, canvas: CanvasInfo): void {
  ctx.save();
  ctx.globalAlpha *= state.alpha;
  if (state.scale !== 1) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.translate(cx, cy);
    ctx.scale(state.scale, state.scale);
    ctx.translate(-cx, -cy);
  }
  if (state.offsetX !== 0 || state.offsetY !== 0) {
    ctx.translate(state.offsetX, state.offsetY);
  }
}
