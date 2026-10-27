import type { VRM } from "@pixiv/three-vrm";
import { Camera, MathUtils, Object3D, Quaternion, Vector3 } from "three";
import { buildRig, curlFingers, solveArm, type ArmRig, type Rig } from "./rig";

export type Phase = "entering" | "knocking" | "greeting" | "idle" | "waving";
type Gesture = "knock" | "wave";

const GESTURE_TIME: Record<Gesture, number> = { knock: 2.1, wave: 2.0 };
const ENTER_TIME = 1.4;

/** Smoothstep envelope: 0 → 1 over `fadeIn`, hold, 1 → 0 over the last `fadeOut` seconds. */
function envelope(t: number, total: number, fadeIn = 0.45, fadeOut = 0.5) {
  const a = MathUtils.smoothstep(t, 0, fadeIn);
  const b = 1 - MathUtils.smoothstep(t, total - fadeOut, total);
  return Math.min(a, b);
}

const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);
const vowels = ["aa", "ih", "ou", "ee", "oh"] as const;

type ArmTarget = { hand: Vector3; pole: Vector3; dir: Vector3; palm: Vector3; curl: number };
const target = (): ArmTarget => ({ hand: new Vector3(), pole: new Vector3(), dir: new Vector3(), palm: new Vector3(), curl: 0 });

/**
 * Drives a VRM character with procedural, bone-level animation:
 * entrance, knock, greeting (talking), idle breathing/sway, wave, blinking,
 * head turn + eye gaze toward the pointer.
 *
 * One gesture runs at a time and arm targets are blended and smoothed, so states
 * never fight over a bone. Call `update` once per frame *before* `vrm.update`.
 */
export class CharacterController {
  readonly rig: Rig;
  phase: Phase = "entering";
  onPhase?: (phase: Phase) => void;

  private vrm: VRM;
  private reduced: boolean;
  private greet: boolean;
  private time = 0;
  private phaseTime = 0;
  private gesture: { kind: Gesture; t: number } | null = null;
  private hold: Gesture | null;

  private talkLeft = 0;
  private talkAudio = false;
  private vowel = 0;
  private vowelTime = 0;
  private mouth = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  private blinkIn = 2;
  private blinkT = -1;
  private happy = 0;

  private look = new Vector3();
  private lookTarget = new Object3D();
  private yaw = 0;
  private pitch = 0;

  private arms: Record<"left" | "right", ArmTarget> = { left: target(), right: target() };
  private goal: ArmTarget = target();
  private restRoot = new Quaternion();
  private baseY: number;
  private baseRotY: number;

  constructor(vrm: VRM, opts: { reduced: boolean; greet: boolean; hold?: Gesture | null }) {
    const rig = buildRig(vrm);
    if (!rig) throw new Error("This model has no usable humanoid rig (arms, head and hips are required).");
    this.vrm = vrm;
    this.rig = rig;
    this.reduced = opts.reduced;
    this.greet = opts.greet && !opts.reduced;
    this.hold = opts.hold ?? null;
    this.baseY = vrm.scene.position.y;
    this.baseRotY = vrm.scene.rotation.y; // VRM 0.x models are pre-rotated 180° by VRMUtils.rotateVRM0
    vrm.scene.add(this.lookTarget);
    if (vrm.lookAt) vrm.lookAt.target = this.lookTarget;
    for (const side of ["left", "right"] as const) this.idleTarget(this.rig[side], this.arms[side]);
    if (this.reduced) this.setPhase("idle");
  }

  dispose() {
    this.lookTarget.removeFromParent();
    if (this.vrm.lookAt) this.vrm.lookAt.target = null;
  }

  /** Click / tap reaction. Ignored while entering or knocking so gestures never overlap. */
  wave() {
    if (this.phase === "entering" || this.phase === "knocking") return false;
    if (!this.reduced) this.gesture = { kind: "wave", t: 0 };
    this.setPhase("waving");
    return true;
  }

  /** Animate the mouth for `seconds`; `audio` marks real speech (Infinity until `stopTalking`). */
  talk(seconds: number, audio = false) {
    this.talkLeft = seconds;
    this.talkAudio = audio;
  }

  stopTalking() {
    this.talkLeft = 0;
  }

  get talking() {
    return this.talkLeft > 0;
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.phaseTime = 0;
    this.onPhase?.(p);
  }

  update(dt: number, pointerX: number, pointerY: number, camera: Camera) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    this.phaseTime += dt;
    const { vrm, rig } = this;
    const scene = vrm.scene;

    // --- State machine ---------------------------------------------------
    if (this.hold && !this.gesture) this.gesture = { kind: this.hold, t: 0 };
    if (this.phase === "entering" && this.phaseTime >= ENTER_TIME) {
      if (this.greet) {
        this.gesture = { kind: "knock", t: 0 };
        this.setPhase("knocking");
      } else this.setPhase("idle");
    }
    if (this.gesture) {
      this.gesture.t += dt;
      const total = GESTURE_TIME[this.gesture.kind];
      if (this.hold) this.gesture.t %= total;
      else if (this.gesture.t >= total) {
        this.gesture = null;
        if (this.phase === "knocking") this.setPhase("greeting");
        else if (this.phase === "waving") this.setPhase("idle");
      }
    }
    if (this.phase === "waving" && this.reduced) this.setPhase("idle");
    if (this.phase === "greeting" && this.talkLeft <= 0 && this.phaseTime > 1.2) this.setPhase("idle");
    if (this.talkLeft > 0 && Number.isFinite(this.talkLeft)) this.talkLeft -= dt;

    // --- Root: entrance --------------------------------------------------
    const enter = this.reduced ? 1 : MathUtils.smoothstep(this.time, 0, ENTER_TIME);
    const easeBack = 1 - Math.pow(1 - enter, 3);
    scene.position.y = this.baseY - 0.35 * (1 - easeBack);
    scene.rotation.y = this.baseRotY + 0.55 * (1 - easeBack);
    scene.updateMatrixWorld(true);
    scene.getWorldQuaternion(this.restRoot);

    // --- Torso: breathing and idle sway ----------------------------------
    const still = this.reduced ? 0 : 1;
    const breath = Math.sin((this.time * Math.PI * 2) / 4.2) * still;
    const sway = Math.sin(this.time * 0.55) * still;
    rig.hips.rotation.set(0, sway * 0.035, sway * 0.012);
    rig.spine?.rotation.set(breath * 0.012, -sway * 0.02, -sway * 0.01);
    rig.chest?.rotation.set(breath * 0.022, 0, 0);

    // --- Head + gaze -----------------------------------------------------
    const greetingFocus = this.phase === "knocking" || this.phase === "greeting" ? 0.45 : 1;
    const px = MathUtils.clamp(pointerX, -1, 1) * greetingFocus;
    const py = MathUtils.clamp(pointerY, -1, 1) * greetingFocus;
    const k = damp(5, dt);
    const headMotion = this.reduced ? 0 : 1;
    this.yaw += (px * 0.42 * headMotion - this.yaw) * k;
    this.pitch += (py * 0.22 * headMotion - this.pitch) * k;
    const tilt = (this.phase === "greeting" || this.phase === "waving" ? 0.07 : 0.02 * Math.sin(this.time * 0.4)) * still;
    rig.neck?.rotation.set(this.pitch * 0.4, this.yaw * 0.4, tilt * 0.3);
    rig.head.rotation.set(this.pitch * (rig.neck ? 0.6 : 1), this.yaw * (rig.neck ? 0.6 : 1), tilt * 0.7);
    scene.updateMatrixWorld(true);

    // Eyes: look at the camera, offset toward the pointer.
    const goalLook = camera.position.clone();
    goalLook.x += px * 0.9;
    goalLook.y -= py * 0.6;
    this.look.lerp(goalLook, damp(9, dt));
    this.lookTarget.position.copy(scene.worldToLocal(this.look.clone()));

    // --- Arms --------------------------------------------------------------
    for (const side of ["left", "right"] as const) {
      const arm = rig[side];
      this.idleTarget(arm, this.goal, breath);
      if (side === "right" && this.gesture) {
        const w = envelope(this.gesture.t, GESTURE_TIME[this.gesture.kind]);
        const g = this.gesture.kind === "knock" ? this.knockTarget(arm, this.gesture.t) : this.waveTarget(arm, this.gesture.t);
        this.goal.hand.lerp(g.hand, w);
        this.goal.pole.lerp(g.pole, w);
        this.goal.dir.lerp(g.dir, w).normalize();
        this.goal.palm.lerp(g.palm, w).normalize();
        this.goal.curl += (g.curl - this.goal.curl) * w;
      }
      const cur = this.arms[side];
      const ka = damp(this.gesture ? 14 : 8, dt);
      cur.hand.lerp(this.goal.hand, ka);
      cur.pole.lerp(this.goal.pole, ka);
      cur.dir.lerp(this.goal.dir, ka).normalize();
      cur.palm.lerp(this.goal.palm, ka).normalize();
      cur.curl += (this.goal.curl - cur.curl) * ka;
      solveArm(scene, this.restRoot, rig.facing, arm, cur.hand, cur.pole, cur.dir, cur.palm);
      curlFingers(arm, cur.curl, rig.facing);
    }

    // --- Face ----------------------------------------------------------------
    const em = vrm.expressionManager;
    if (em) {
      // Natural blinking: random 2–5 s gaps, occasional double blink.
      this.blinkIn -= dt;
      if (this.blinkIn <= 0 && this.blinkT < 0) {
        this.blinkT = 0;
        this.blinkIn = 2 + Math.random() * 3;
        if (Math.random() < 0.2) this.blinkIn = 0.35;
      }
      let blink = 0;
      if (this.blinkT >= 0) {
        this.blinkT += dt;
        blink = Math.sin(Math.min(1, this.blinkT / 0.16) * Math.PI);
        if (this.blinkT >= 0.16) this.blinkT = -1;
      }
      em.setValue("blink", blink);

      const cheerful = this.phase === "greeting" || this.phase === "waving" || this.phase === "knocking";
      this.happy += ((cheerful ? 0.32 : 0.12) - this.happy) * damp(3, dt);
      em.setValue("happy", this.happy * (1 - blink));

      // Mouth: cycle between vowel shapes while talking. Without audio this is a talking
      // animation, not lip sync; with speech synthesis it runs for the utterance's duration.
      const talking = this.talkLeft > 0 && !this.reduced;
      this.vowelTime -= dt;
      if (this.vowelTime <= 0) {
        this.vowel = Math.floor(Math.random() * vowels.length);
        this.vowelTime = 0.08 + Math.random() * 0.1;
      }
      const open = talking ? 0.35 + 0.45 * Math.abs(Math.sin(this.time * (this.talkAudio ? 13 : 11))) : 0;
      vowels.forEach((v, i) => {
        const goalV = i === this.vowel ? open : 0;
        this.mouth[v] += (goalV - this.mouth[v]) * damp(18, dt);
        em.setValue(v, this.mouth[v]);
      });
    }
  }

  // --- Pose targets, in canonical space (faces +Z, character's left is +X) -----------------------------------------
  private idleTarget(arm: ArmRig, out: ArmTarget, breath = 0) {
    const L = arm.upperLen + arm.lowerLen;
    const s = arm.side;
    out.hand.copy(arm.shoulder).add(new Vector3(s * 0.12 * L, -0.9 * L + breath * 0.006, 0.08 * L));
    out.pole.copy(arm.shoulder).add(new Vector3(s * 0.25 * L, -0.4 * L, -1.0 * L));
    out.dir.set(s * 0.05, -1, 0.12).normalize();
    out.palm.set(-s, 0, 0.15).normalize();
    out.curl = 0.3;
    return out;
  }

  private knock = target();
  private knockTarget(arm: ArmRig, t: number) {
    const L = arm.upperLen + arm.lowerLen;
    const s = arm.side;
    const headY = this.rig.headRest.y;
    // Three quick taps toward the viewer, as if knocking on the screen.
    let tap = 0;
    for (const t0 of [0.75, 1.02, 1.29]) {
      if (t > t0 && t < t0 + 0.2) tap = Math.sin(((t - t0) / 0.2) * Math.PI);
    }
    const o = this.knock;
    o.hand.set(arm.shoulder.x * 0.35, headY - 0.1 * L, arm.shoulder.z + 0.62 * L + tap * 0.09 * L);
    o.pole.copy(arm.shoulder).add(new Vector3(s * 0.7 * L, -1.0 * L, -0.1 * L));
    o.dir.set(-s * 0.15, 0.75 + tap * 0.1, 0.45 - tap * 0.25).normalize();
    o.palm.set(-s * 0.85, -0.2, -0.4).normalize();
    o.curl = 1;
    return o;
  }

  private waveT = target();
  private waveTarget(arm: ArmRig, t: number) {
    const L = arm.upperLen + arm.lowerLen;
    const s = arm.side;
    const swing = Math.sin(t * Math.PI * 2 * 1.9) * MathUtils.smoothstep(t, 0.35, 0.6);
    const o = this.waveT;
    o.hand.copy(arm.shoulder).add(new Vector3(s * 0.32 * L + swing * 0.1 * L, 0.5 * L, 0.2 * L));
    o.pole.copy(arm.shoulder).add(new Vector3(s * 1.0 * L, -0.7 * L, -0.25 * L));
    o.dir.set(swing * 0.35 + s * 0.1, 1, 0.08).normalize();
    o.palm.set(0, 0, 1);
    o.curl = 0.05;
    return o;
  }
}
