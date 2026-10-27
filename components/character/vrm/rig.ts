import type { VRM, VRMHumanBoneName } from "@pixiv/three-vrm";
import { Object3D, Quaternion, Vector3 } from "three";

/*
 * Pose helpers for VRM normalized humanoid bones.
 *
 * Normalized bones have an identity rest rotation, so in the rest (T-)pose every
 * bone's world orientation equals the model root's orientation. That lets us aim a
 * bone by comparing its rest direction with a desired world direction.
 */

const _from = new Vector3();
const _to = new Vector3();
const _cur = new Vector3();
const _want = new Vector3();
const _cross = new Vector3();
const _qWorld = new Quaternion();
const _qTwist = new Quaternion();
const _qParent = new Quaternion();

/**
 * Local quaternion that points `restDir` (bone-local, rest pose) along `dirWorld`, then twists
 * around that direction so `sideRest` faces `sideWorld` as closely as possible.
 */
export function aimBone(
  bone: Object3D,
  restRoot: Quaternion,
  restDir: Vector3,
  dirWorld: Vector3,
  sideRest: Vector3,
  sideWorld: Vector3,
  out: Quaternion,
) {
  _from.copy(restDir).applyQuaternion(restRoot).normalize();
  _to.copy(dirWorld).normalize();
  _qWorld.setFromUnitVectors(_from, _to);

  _cur.copy(sideRest).applyQuaternion(restRoot).applyQuaternion(_qWorld);
  _cur.addScaledVector(_to, -_cur.dot(_to));
  _want.copy(sideWorld).addScaledVector(_to, -sideWorld.dot(_to));
  if (_cur.lengthSq() > 1e-8 && _want.lengthSq() > 1e-8) {
    _cur.normalize();
    _want.normalize();
    const angle = Math.atan2(_cross.crossVectors(_cur, _want).dot(_to), _cur.dot(_want));
    _qWorld.premultiply(_qTwist.setFromAxisAngle(_to, angle));
  }

  bone.parent!.getWorldQuaternion(_qParent);
  return out.copy(_qParent.invert()).multiply(_qWorld).multiply(restRoot);
}

export type ArmRig = {
  side: 1 | -1; // +1 = character's left (+X in VRM 1.0 space), -1 = right
  upper: Object3D;
  lower: Object3D;
  hand: Object3D;
  upperLen: number;
  lowerLen: number;
  restUpperDir: Vector3;
  restLowerDir: Vector3;
  restHandDir: Vector3;
  /** Shoulder (upper arm) position at rest, in canonical space (character faces +Z, left is +X). */
  shoulder: Vector3;
  fingers: Object3D[][]; // [finger][proximal, intermediate, distal]
};

export type Rig = {
  left: ArmRig;
  right: ArmRig;
  head: Object3D;
  neck: Object3D | null;
  chest: Object3D | null;
  spine: Object3D | null;
  hips: Object3D;
  headRest: Vector3; // canonical space
  /** +1 for VRM 1.0 (faces +Z in model space), -1 for VRM 0.x (faces -Z). */
  facing: 1 | -1;
};

const node = (vrm: VRM, name: VRMHumanBoneName) => vrm.humanoid.getNormalizedBoneNode(name);

function armRig(vrm: VRM, side: 1 | -1, facing: 1 | -1): ArmRig | null {
  const s = side === 1 ? "left" : "right";
  // In canonical space the character's left is +X; a VRM 0.x model's own left is -X.
  const upper = node(vrm, `${s}UpperArm` as VRMHumanBoneName);
  const lower = node(vrm, `${s}LowerArm` as VRMHumanBoneName);
  const hand = node(vrm, `${s}Hand` as VRMHumanBoneName);
  if (!upper || !lower || !hand) return null;
  const middle = node(vrm, `${s}MiddleProximal` as VRMHumanBoneName);
  const fingers = (["Index", "Middle", "Ring", "Little"] as const).map((f) =>
    (["Proximal", "Intermediate", "Distal"] as const)
      .map((j) => node(vrm, `${s}${f}${j}` as VRMHumanBoneName))
      .filter((n): n is Object3D => Boolean(n)),
  );
  const shoulder = new Vector3();
  upper.getWorldPosition(shoulder);
  vrm.scene.worldToLocal(shoulder);
  shoulder.set(shoulder.x * facing, shoulder.y, shoulder.z * facing);
  return {
    side,
    upper,
    lower,
    hand,
    upperLen: lower.position.length(),
    lowerLen: hand.position.length(),
    restUpperDir: lower.position.clone().normalize(),
    restLowerDir: hand.position.clone().normalize(),
    restHandDir: (middle ? middle.position : hand.position).clone().normalize(),
    shoulder,
    fingers,
  };
}

/** Collects the bones the controller needs. Returns null if the model lacks a usable humanoid. */
export function buildRig(vrm: VRM): Rig | null {
  vrm.scene.updateMatrixWorld(true);
  const facing: 1 | -1 = vrm.meta?.metaVersion === "0" ? -1 : 1;
  const left = armRig(vrm, 1, facing);
  const right = armRig(vrm, -1, facing);
  const head = node(vrm, "head");
  const hips = node(vrm, "hips");
  if (!left || !right || !head || !hips) return null;
  const headRest = new Vector3();
  head.getWorldPosition(headRest);
  vrm.scene.worldToLocal(headRest);
  headRest.set(headRest.x * facing, headRest.y, headRest.z * facing);
  return { facing, left, right, head, hips, neck: node(vrm, "neck"), chest: node(vrm, "chest") ?? node(vrm, "upperChest"), spine: node(vrm, "spine"), headRest };
}

const _S = new Vector3();
const _H = new Vector3();
const _P = new Vector3();
const _u = new Vector3();
const _p = new Vector3();
const _E = new Vector3();
const _d1 = new Vector3();
const _d2 = new Vector3();
const _side = new Vector3();
const _q = new Quaternion();
const _fwd = new Vector3();
const DOWN = new Vector3(0, -1, 0);

/**
 * Two-bone IK in model space. Places the hand at `hand`, bends the elbow toward `pole`,
 * points the hand along `handDir` and turns the palm toward `palm`.
 * Bones are set directly; callers smooth the targets, not the result.
 */
export function solveArm(
  root: Object3D,
  restRoot: Quaternion,
  facing: 1 | -1,
  arm: ArmRig,
  hand: Vector3,
  pole: Vector3,
  handDir: Vector3,
  palm: Vector3,
) {
  // Inputs are canonical (faces +Z); mirror X/Z into the model's own space.
  const toModel = (v: Vector3, out: Vector3) => out.set(v.x * facing, v.y, v.z * facing);
  const a = arm.upperLen;
  const b = arm.lowerLen;
  arm.upper.getWorldPosition(_S);
  root.localToWorld(toModel(hand, _H));
  root.localToWorld(toModel(pole, _P));

  _u.subVectors(_H, _S);
  const d = Math.min(Math.max(_u.length(), Math.abs(a - b) + 1e-4), (a + b) * 0.999);
  _u.normalize();
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  _p.subVectors(_P, _S);
  _p.addScaledVector(_u, -_p.dot(_u));
  if (_p.lengthSq() < 1e-8) _p.set(0, -1, 0);
  _p.normalize();
  _E.copy(_S).addScaledVector(_u, a * cosA).addScaledVector(_p, a * sinA);
  _H.copy(_S).addScaledVector(_u, d);

  _d1.subVectors(_E, _S);
  _d2.subVectors(_H, _E);
  // Twist the upper arm so its front (the elbow's bending side) faces the forearm.
  _side.copy(_d2);
  arm.upper.quaternion.copy(aimBone(arm.upper, restRoot, arm.restUpperDir, _d1, _fwd.set(0, 0, facing), _side, _q));
  arm.upper.updateMatrixWorld(true);

  const worldPalm = toModel(palm, new Vector3()).transformDirection(root.matrixWorld);
  arm.lower.quaternion.copy(aimBone(arm.lower, restRoot, arm.restLowerDir, _d2, DOWN, worldPalm, _q));
  arm.lower.updateMatrixWorld(true);

  const worldHandDir = toModel(handDir, new Vector3()).transformDirection(root.matrixWorld);
  arm.hand.quaternion.copy(aimBone(arm.hand, restRoot, arm.restHandDir, worldHandDir, DOWN, worldPalm, _q));
  arm.hand.updateMatrixWorld(true);
}

/** Curls the four fingers; 0 = relaxed straight, 1 = loose fist. */
export function curlFingers(arm: ArmRig, amount: number, facing: 1 | -1) {
  const k = [1.25, 1.45, 1.0];
  // Fingers point along ±X in the rest pose; rotating about Z curls them toward the palm (-Y).
  const sign = -arm.side * facing;
  for (const finger of arm.fingers) {
    finger.forEach((joint, i) => joint.rotation.set(0, 0, sign * k[i] * amount));
  }
}
