"use client";

import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CharacterPointer } from "../useCharacterPointer";
import { CharacterController, type Phase } from "./CharacterController";

export type StageStatus = { state: "loading"; progress: number | null } | { state: "ready" } | { state: "error"; message: string };

type Props = {
  url: string;
  pointer: CharacterPointer;
  reduced: boolean;
  greet: boolean;
  hold: "knock" | "wave" | null;
  active: boolean;
  controllerRef: React.RefObject<CharacterController | null>;
  onStatus: (s: StageStatus) => void;
  onPhase: (p: Phase) => void;
};

function Model({ url, pointer, reduced, greet, hold, controllerRef, onStatus, onPhase }: Omit<Props, "active">) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const camera = useThree((s) => s.camera);
  // Latest callbacks/options without re-running the loader when they change.
  const latest = useRef({ reduced, greet, hold, onStatus, onPhase });
  useEffect(() => {
    latest.current = { reduced, greet, hold, onStatus, onPhase };
  });

  useEffect(() => {
    let cancelled = false;
    let loaded: VRM | null = null;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    latest.current.onStatus({ state: "loading", progress: null });

    loader.load(
      url,
      (gltf) => {
        const model = gltf.userData.vrm as VRM | undefined;
        if (!model) {
          VRMUtils.deepDispose(gltf.scene);
          if (!cancelled) latest.current.onStatus({ state: "error", message: "The file loaded, but it is not a VRM model." });
          return;
        }
        if (cancelled) {
          VRMUtils.deepDispose(model.scene);
          return;
        }
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);
        VRMUtils.rotateVRM0(model);
        model.scene.traverse((o) => (o.frustumCulled = false));

        let controller: CharacterController;
        try {
          const { reduced: r, greet: g, hold: h } = latest.current;
          controller = new CharacterController(model, { reduced: r, greet: g, hold: h });
        } catch (e) {
          VRMUtils.deepDispose(model.scene);
          latest.current.onStatus({ state: "error", message: e instanceof Error ? e.message : String(e) });
          return;
        }
        controller.onPhase = (p) => latest.current.onPhase(p);
        controllerRef.current = controller;
        loaded = model;

        // Frame the upper body: a little above the head down to the waist.
        const head = new Vector3();
        controller.rig.head.getWorldPosition(head);
        camera.position.set(0, head.y - 0.1, 1.75);
        camera.lookAt(0, head.y - 0.2, 0);
        model.springBoneManager?.reset();

        setVrm(model);
        latest.current.onStatus({ state: "ready" });
        latest.current.onPhase(controller.phase);
      },
      (e) => {
        if (!cancelled) latest.current.onStatus({ state: "loading", progress: e.total ? e.loaded / e.total : null });
      },
      (err) => {
        if (!cancelled) latest.current.onStatus({ state: "error", message: err instanceof Error ? err.message : "The model could not be loaded." });
      },
    );

    return () => {
      cancelled = true;
      if (loaded) {
        controllerRef.current?.dispose();
        controllerRef.current = null;
        VRMUtils.deepDispose(loaded.scene);
      }
    };
  }, [url, camera, controllerRef]);

  useFrame((_, delta) => {
    const c = controllerRef.current;
    if (!vrm || !c) return;
    c.update(delta, pointer.x.get(), pointer.y.get(), camera);
    vrm.update(Math.min(delta, 1 / 20));
  });

  return vrm ? <primitive object={vrm.scene} /> : null;
}

/** Transparent canvas that renders the VRM character with soft pastel lighting. */
export default function VrmStage({ active, ...props }: Props) {
  return (
    <Canvas
      aria-hidden
      flat
      dpr={[1, 1.75]}
      camera={{ fov: 24, near: 0.1, far: 20, position: [0, 1.3, 2.2] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[1.2, 2.2, 2.5]} intensity={1.7} color="#fff4f8" />
      <directionalLight position={[-2, 1.2, -1.5]} intensity={0.9} color="#d9cbff" />
      <Model {...props} />
    </Canvas>
  );
}
