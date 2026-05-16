import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Box, Layers, Ruler, MousePointer2, Move } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

const ROOM = { xMin: -6.7, xMax: 6.7, yMin: -10.75, yMax: 10.75, zMin: 0, zMax: 7.2 };
const CENTER = { x: 0, y: 0, z: 2.5 };
const LISTENER_HEIGHT_M = 5.8 * 0.3048; // 5.8 ft ≈ 1.77 m

const DEFAULT_LAYERS = {
  ceiling: { name: "Ceiling Layer", short: "Ceiling", z: 7.2, color: "#2f9bff", count: 16 },
  upper: { name: "Upper Wall Ring", short: "Upper", z: 4.0, color: "#ff8a1c", count: 16 },
  middle: { name: "Middle Wall Ring", short: "Middle", z: 5.5, color: "#7bc950", count: 10 },
};

const DEFAULT_SPEAKER_SPECS = {
  ceiling: { model: "Ceiling module", horizontalDeg: 90, verticalDeg: 60, maxDistanceM: 10, spl1mDb: 109 },
  upper: { model: "Upper wall module", horizontalDeg: 90, verticalDeg: 60, maxDistanceM: 10, spl1mDb: 109 },
  middle: { model: "Middle wall module", horizontalDeg: 90, verticalDeg: 60, maxDistanceM: 10, spl1mDb: 109 },
};

const DEFAULT_SPEAKERS = [
  { id: 1, layer: "ceiling", wall: "Ceiling", x: -6.0, y: -9.0, z: 7.2, az: 236.3, tilt: 64.4 },
  { id: 2, layer: "ceiling", wall: "Ceiling", x: -6.0, y: -3.0, z: 7.2, az: 206.6, tilt: 54.8 },
  { id: 3, layer: "ceiling", wall: "Ceiling", x: -6.0, y: 3.0, z: 7.2, az: 153.4, tilt: 54.8 },
  { id: 4, layer: "ceiling", wall: "Ceiling", x: -6.0, y: 9.0, z: 7.2, az: 123.7, tilt: 64.4 },
  { id: 5, layer: "ceiling", wall: "Ceiling", x: -2.0, y: -9.0, z: 7.2, az: 257.5, tilt: 58.5 },
  { id: 6, layer: "ceiling", wall: "Ceiling", x: -2.0, y: -3.0, z: 7.2, az: 213.7, tilt: 39.9 },
  { id: 7, layer: "ceiling", wall: "Ceiling", x: -2.0, y: 3.0, z: 7.2, az: 146.3, tilt: 39.9 },
  { id: 8, layer: "ceiling", wall: "Ceiling", x: -2.0, y: 9.0, z: 7.2, az: 102.5, tilt: 58.5 },
  { id: 9, layer: "ceiling", wall: "Ceiling", x: 2.0, y: -9.0, z: 7.2, az: 282.5, tilt: 58.5 },
  { id: 10, layer: "ceiling", wall: "Ceiling", x: 2.0, y: -3.0, z: 7.2, az: 326.3, tilt: 39.9 },
  { id: 11, layer: "ceiling", wall: "Ceiling", x: 2.0, y: 3.0, z: 7.2, az: 33.7, tilt: 39.9 },
  { id: 12, layer: "ceiling", wall: "Ceiling", x: 2.0, y: 9.0, z: 7.2, az: 77.5, tilt: 58.5 },
  { id: 13, layer: "ceiling", wall: "Ceiling", x: 6.0, y: -9.0, z: 7.2, az: 123.7, tilt: 64.4 },
  { id: 14, layer: "ceiling", wall: "Ceiling", x: 6.0, y: -3.0, z: 7.2, az: 153.4, tilt: 54.8 },
  { id: 15, layer: "ceiling", wall: "Ceiling", x: 6.0, y: 3.0, z: 7.2, az: 206.6, tilt: 54.8 },
  { id: 16, layer: "ceiling", wall: "Ceiling", x: 6.0, y: 9.0, z: 7.2, az: 236.3, tilt: 64.4 },
  { id: 17, layer: "upper", wall: "Left", x: -6.7, y: -8.0, z: 4.0, az: 230.1, tilt: 16.7 },
  { id: 18, layer: "upper", wall: "Left", x: -6.7, y: -2.7, z: 4.0, az: 202.0, tilt: 17.0 },
  { id: 19, layer: "upper", wall: "Left", x: -6.7, y: 2.7, z: 4.0, az: 158.0, tilt: 17.0 },
  { id: 20, layer: "upper", wall: "Left", x: -6.7, y: 8.0, z: 4.0, az: 129.9, tilt: 16.7 },
  { id: 21, layer: "upper", wall: "Right", x: 6.7, y: -8.0, z: 4.0, az: 129.9, tilt: 16.7 },
  { id: 22, layer: "upper", wall: "Right", x: 6.7, y: -2.7, z: 4.0, az: 158.0, tilt: 17.0 },
  { id: 23, layer: "upper", wall: "Right", x: 6.7, y: 2.7, z: 4.0, az: 202.0, tilt: 17.0 },
  { id: 24, layer: "upper", wall: "Right", x: 6.7, y: 8.0, z: 4.0, az: 230.1, tilt: 16.7 },
  { id: 25, layer: "upper", wall: "Front", x: -5.5, y: 10.75, z: 4.0, az: 27.1, tilt: 15.3 },
  { id: 26, layer: "upper", wall: "Front", x: -1.8, y: 10.75, z: 4.0, az: 9.5, tilt: 11.9 },
  { id: 27, layer: "upper", wall: "Front", x: 1.8, y: 10.75, z: 4.0, az: -9.5, tilt: 11.9 },
  { id: 28, layer: "upper", wall: "Front", x: 5.5, y: 10.75, z: 4.0, az: -27.1, tilt: 15.3 },
  { id: 29, layer: "upper", wall: "Back", x: -5.5, y: -10.75, z: 4.0, az: 152.9, tilt: 15.3 },
  { id: 30, layer: "upper", wall: "Back", x: -1.8, y: -10.75, z: 4.0, az: 170.5, tilt: 11.9 },
  { id: 31, layer: "upper", wall: "Back", x: 1.8, y: -10.75, z: 4.0, az: 189.5, tilt: 11.9 },
  { id: 32, layer: "upper", wall: "Back", x: 5.5, y: -10.75, z: 4.0, az: 207.1, tilt: 15.3 },
  { id: 33, layer: "middle", wall: "Left", x: -6.7, y: -6.0, z: 5.5, az: 221.8, tilt: 29.4 },
  { id: 34, layer: "middle", wall: "Left", x: -6.7, y: 6.0, z: 5.5, az: 138.2, tilt: 29.4 },
  { id: 35, layer: "middle", wall: "Right", x: 6.7, y: -6.0, z: 5.5, az: 138.2, tilt: 29.4 },
  { id: 36, layer: "middle", wall: "Right", x: 6.7, y: 6.0, z: 5.5, az: 221.8, tilt: 29.4 },
  { id: 37, layer: "middle", wall: "Front", x: -4.0, y: 10.75, z: 5.5, az: 20.4, tilt: 25.6 },
  { id: 38, layer: "middle", wall: "Front", x: 4.0, y: 10.75, z: 5.5, az: -20.4, tilt: 25.6 },
  { id: 39, layer: "middle", wall: "Back", x: -4.0, y: -10.75, z: 5.5, az: 159.6, tilt: 25.6 },
  { id: 40, layer: "middle", wall: "Back", x: 4.0, y: -10.75, z: 5.5, az: 200.4, tilt: 25.6 },
  { id: 41, layer: "middle", wall: "Front", x: 0, y: 10.75, z: 5.5, az: 0.0, tilt: 21.6 },
  { id: 42, layer: "middle", wall: "Back", x: 0, y: -10.75, z: 5.5, az: 180.0, tilt: 21.6 },
];

const CORNERS = [
  { label: "Back-left-floor", x: ROOM.xMin, y: ROOM.yMin, z: ROOM.zMin },
  { label: "Back-right-floor", x: ROOM.xMax, y: ROOM.yMin, z: ROOM.zMin },
  { label: "Front-right-floor", x: ROOM.xMax, y: ROOM.yMax, z: ROOM.zMin },
  { label: "Front-left-floor", x: ROOM.xMin, y: ROOM.yMax, z: ROOM.zMin },
  { label: "Back-left-ceiling", x: ROOM.xMin, y: ROOM.yMin, z: ROOM.zMax },
  { label: "Back-right-ceiling", x: ROOM.xMax, y: ROOM.yMin, z: ROOM.zMax },
  { label: "Front-right-ceiling", x: ROOM.xMax, y: ROOM.yMax, z: ROOM.zMax },
  { label: "Front-left-ceiling", x: ROOM.xMin, y: ROOM.yMax, z: ROOM.zMax },
];

const ROOM_EDGES = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const SIDES = [["Left", "L"], ["Right", "R"], ["Front", "F"], ["Back", "B"]];

const HELP_TEXT = {
  listenerX: "Listener X position in meters. Move this left/right across the room width.",
  listenerY: "Listener Y position in meters. Move this front/back through the room depth.",
  listenerZ: "Listener ear/head height. Locked to 5.8 ft ≈ 1.77 m for a seated/standing reference listener.",
  listenerAzimuth: "Listener facing direction in degrees. This rotates the listener-local coordinate system used for azimuth, ITD, ILD and translation relevance.",
  dbapObject: "Turns on the DBAP phantom sound object. The purple point is the sound position formed by the nearest active speaker triangle.",
  objectX: "Sound object X coordinate in meters. Changes left/right placement in the sound field.",
  objectY: "Sound object Y coordinate in meters. Changes front/back placement in the sound field.",
  objectZ: "Sound object Z coordinate in meters. Changes vertical height of the phantom source.",
  frequency: "Frequency used for binaural translation relevance. Low frequencies rely more on ITD; high frequencies rely more on ILD.",
  targetPercent: "Desired translation percentage for a typical object movement. Auto calibration adjusts parameters to hit this value.",
  calibrateBy: "Chooses which parameter the auto-calibrator should tune: max angle, sensitivity, binaural mix, or automatic selection.",
  maxAngle: "Reference angular movement that maps to 100%. Smaller values make the same physical movement produce a higher percentage.",
  sensitivity: "Linear multiplier applied after the translation calculation. Increase it when the model feels under-responsive.",
  binauralMix: "Blend between pure angular movement and binaural ITD/ILD weighting. 0 = angle only, 1 = full binaural weighting.",
  useBinaural: "Enables ITD/ILD weighting. Disable it to see pure angular displacement percentage.",
  autoCalibrate: "Computes max angle, sensitivity, or binaural mix so the current start-to-object movement reaches the target percentage.",
  setStart: "Stores the current DBAP object position as the start point for translation relevance measurement.",
  roomTargetFrequency: "Target room-mode frequency in Hz. The mode search looks for integer p/q/r combinations close to this frequency.",
  roomSpeed: "Speed of sound used in the room-mode formula. 343 m/s is a common reference at about 20°C.",
  roomTolerance: "Allowed error range for matching integer room modes to the target frequency. Higher tolerance shows more matches.",
  showRoomModes: "Shows the selected room-mode surfaces directly inside the main 3D layout.",
  layerSide: "Layer-side focus. You can activate multiple sides across layers, such as Ceiling L + Upper L + Middle L.",
  scope: "Number of currently visible/focused speakers used by geometry overlays like Icosahedral and DBAP.",
  coverageHorizontal: "Horizontal coverage angle in degrees. Wider values create a wider translucent beam polygon in the main 3D layout.",
  coverageVertical: "Vertical coverage angle in degrees. Used for coverage-height estimation at the listener distance.",
  coverageDistance: "Maximum useful throw distance in meters. The coverage polygon stops at this range.",
  coverageSpl: "Approximate SPL at 1 meter. Listener SPL estimate uses inverse-square distance loss.",
  coverageScope: "Selected draws only the selected speaker. Visible draws all currently visible/focused speakers.",
};

function HelpTip({ id, active }) {
  const [open, setOpen] = useState(false);
  if (!active) return null;
  return (
    <span className="relative inline-flex align-middle">
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }} className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-300 bg-sky-50 text-[10px] font-black text-sky-800 hover:bg-sky-100">?</button>
      {open && <span className="absolute z-50 mt-5 w-56 rounded-xl border border-slate-200 bg-white p-3 text-left text-[11px] font-semibold leading-snug text-slate-700 shadow-xl shadow-slate-300/60">{HELP_TEXT[id] || "Parameter help."}</span>}
    </span>
  );
}

function HelpToggle({ active, setActive }) {
  return (
    <button onClick={() => setActive((v) => !v)} className={`fixed right-4 top-4 z-[100] rounded-full border px-4 py-2 text-xs font-black shadow-lg ${active ? "border-sky-500 bg-sky-600 text-white" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"}`}>Help {active ? "ON" : "OFF"}</button>
  );
}

function degToRad(deg) { return (deg * Math.PI) / 180; }
function distance3D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function angleBetweenSpeakersFromListener(listener, a, b) {
  const ax = a.x - listener.x, ay = a.y - listener.y, az = a.z - listener.z;
  const bx = b.x - listener.x, by = b.y - listener.y, bz = b.z - listener.z;
  const dot = ax * bx + ay * by + az * bz;
  const magA = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
  const magB = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
  const cosine = clamp(dot / (magA * magB), -1, 1);
  return Math.acos(cosine) * 180 / Math.PI;
}
function findMinimumSeparation(listener, speakers) {
  if (!speakers || speakers.length < 2) return null;
  let best = null;
  for (let i = 0; i < speakers.length; i += 1) {
    for (let j = i + 1; j < speakers.length; j += 1) {
      const angle = angleBetweenSpeakersFromListener(listener, speakers[i], speakers[j]);
      if (!best || angle < best.angle) best = { a: speakers[i], b: speakers[j], angle };
    }
  }
  return best;
}
function findDBAPTriangle(soundObject, speakers) {
  if (!speakers || speakers.length < 3) return [];
  return [...speakers]
    .sort((a, b) => distance3D(soundObject, a) - distance3D(soundObject, b))
    .slice(0, 3);
}
function rotationMatrix(yaw, pitch, roll) {
  const cy = Math.cos(degToRad(yaw)), sy = Math.sin(degToRad(yaw));
  const cp = Math.cos(degToRad(pitch)), sp = Math.sin(degToRad(pitch));
  const cr = Math.cos(degToRad(roll)), sr = Math.sin(degToRad(roll));
  return [
    [cy * cr + sy * sp * sr, cy * -sr + sy * sp * cr, sy * cp],
    [cp * sr, cp * cr, -sp],
    [-sy * cr + cy * sp * sr, sy * sr + cy * sp * cr, cy * cp],
  ];
}
function transformVector(v, matrix) {
  return {
    x: matrix[0][0] * v.x + matrix[0][1] * v.y + matrix[0][2] * v.z,
    y: matrix[1][0] * v.x + matrix[1][1] * v.y + matrix[1][2] * v.z,
    z: matrix[2][0] * v.x + matrix[2][1] * v.y + matrix[2][2] * v.z,
  };
}
function translationPercentageRaw({
  startPos,
  endPos,
  listenerPos,
  listenerYawDeg = 0,
  listenerPitchDeg = 0,
  listenerRollDeg = 0,
  freqHz = 1000,
  headRadiusM = 0.0875,
  speedOfSound = 343,
}) {
  const matrix = rotationMatrix(listenerYawDeg, listenerPitchDeg, listenerRollDeg);
  const localStart = transformVector({ x: startPos.x - listenerPos.x, y: startPos.y - listenerPos.y, z: startPos.z - listenerPos.z }, matrix);
  const localEnd = transformVector({ x: endPos.x - listenerPos.x, y: endPos.y - listenerPos.y, z: endPos.z - listenerPos.z }, matrix);

  const toAzEl = (v) => ({ az: Math.atan2(v.x, v.z), el: Math.atan2(v.y, Math.hypot(v.x, v.z)) });
  const a1 = toAzEl(localStart);
  const a2 = toAzEl(localEnd);

  const sinAz = Math.sin((a2.az - a1.az) / 2);
  const sinEl = Math.sin((a2.el - a1.el) / 2);
  const hav = sinEl * sinEl + Math.cos(a1.el) * Math.cos(a2.el) * sinAz * sinAz;
  const angularDistDeg = (2 * Math.asin(Math.sqrt(Math.min(1, hav))) * 180) / Math.PI;
  const angularPercent = (angularDistDeg / 180) * 100;

  const itd = (az) => {
    const theta = Math.abs(az);
    if (theta <= Math.PI / 2) return (headRadiusM / speedOfSound) * (Math.sin(theta) + theta);
    return (headRadiusM / speedOfSound) * (Math.sin(theta) + Math.PI - theta);
  };
  const itdChange = Math.abs(itd(a1.az) - itd(a2.az));
  const maxItd = (headRadiusM / speedOfSound) * Math.PI;
  const itdNorm = Math.min(1, itdChange / maxItd);

  const ild = (az, freq) => {
    if (freq <= 0) return 0;
    const omega = 2 * Math.PI * freq;
    const k = omega * headRadiusM / speedOfSound;
    const limited = clamp(k * Math.sin(az), -0.99, 0.99);
    if (Math.abs(limited) < 1e-6) return 0;
    const ildDb = 20 * Math.log10((1 + limited) / (1 - limited));
    return clamp(ildDb, -25, 25);
  };
  const ildChange = Math.abs(ild(a1.az, freqHz) - ild(a2.az, freqHz));
  const ildNorm = Math.min(1, ildChange / 25);

  const crossover = 1200;
  let wItd = 0.9, wIld = 0.1;
  if (freqHz > crossover * 2) {
    wItd = 0.1;
    wIld = 0.9;
  } else if (freqHz >= crossover) {
    const t = (freqHz - crossover) / crossover;
    wItd = 0.9 - 0.8 * t;
    wIld = 0.1 + 0.8 * t;
  }
  const binauralWeight = wItd * itdNorm + wIld * ildNorm;

  return { angularPercent, angularDistDeg, binauralWeight, itdNorm, ildNorm, wItd, wIld };
}

function computeTranslationWithParams({
  startPos,
  endPos,
  listenerPos,
  listenerYawDeg = 0,
  listenerPitchDeg = 0,
  listenerRollDeg = 0,
  freqHz = 1000,
  maxAngleDeg = 180,
  sensitivity = 1,
  binauralMix = 0.5,
  useBinaural = true,
}) {
  const raw = translationPercentageRaw({ startPos, endPos, listenerPos, listenerYawDeg, listenerPitchDeg, listenerRollDeg, freqHz });
  const angularPercentScaled = Math.min(100, (raw.angularDistDeg / Math.max(1e-6, maxAngleDeg)) * 100);
  const mixFactor = useBinaural ? ((1 - binauralMix) + binauralMix * raw.binauralWeight) : 1;
  const percent = clamp(angularPercentScaled * mixFactor * sensitivity, 0, 100);
  return {
    percent,
    angularDistDeg: raw.angularDistDeg,
    angularPercent: angularPercentScaled,
    itdNorm: raw.itdNorm,
    ildNorm: raw.ildNorm,
    binauralWeight: raw.binauralWeight,
    wItd: raw.wItd,
    wIld: raw.wIld,
    mode: useBinaural ? "Angular + binaural mix" : "Angular only",
  };
}

function calibrateTranslationParameters({
  startPos,
  endPos,
  listenerPos,
  targetPercent = 70,
  listenerYawDeg = 0,
  listenerPitchDeg = 0,
  listenerRollDeg = 0,
  freqHz = 1000,
  adjust = "auto",
  constrainToReasonable = true,
}) {
  const raw = translationPercentageRaw({ startPos, endPos, listenerPos, listenerYawDeg, listenerPitchDeg, listenerRollDeg, freqHz });
  let chosen = adjust;
  const target = clamp(targetPercent, 0, 100);
  const params = { maxAngleDeg: 180, sensitivity: 1, binauralMix: 0.5, useBinaural: true, chosen: adjust };

  if (chosen === "auto") {
    if (raw.binauralWeight > 0.8) chosen = "binaural_mix";
    else if (raw.angularPercent < 20) chosen = "max_angle_deg";
    else chosen = "sensitivity";
  }
  params.chosen = chosen;

  if (chosen === "max_angle_deg") {
    const mix = 0.5;
    const base = (1 - mix) + mix * raw.binauralWeight;
    const angularDistDeg = (raw.angularPercent / 100) * 180;
    let requiredMax = target <= 0 ? 360 : (angularDistDeg * 100 * base) / target;
    if (constrainToReasonable) requiredMax = clamp(requiredMax, 10, 360);
    params.maxAngleDeg = requiredMax;
    params.binauralMix = mix;
    params.sensitivity = 1;
  } else if (chosen === "sensitivity") {
    const mix = 0.5;
    const base = Math.max(1e-6, (1 - mix) + mix * raw.binauralWeight);
    let requiredSensitivity = target / Math.max(1e-6, raw.angularPercent * base);
    if (constrainToReasonable) requiredSensitivity = clamp(requiredSensitivity, 0.1, 10);
    params.sensitivity = requiredSensitivity;
    params.maxAngleDeg = 180;
    params.binauralMix = mix;
  } else if (chosen === "binaural_mix") {
    let requiredMix;
    if (raw.angularPercent <= 0 || Math.abs(raw.binauralWeight - 1) < 1e-6) {
      requiredMix = 0;
      params.sensitivity = target / Math.max(1e-6, raw.angularPercent);
    } else {
      requiredMix = (1 - target / raw.angularPercent) / (1 - raw.binauralWeight);
    }
    if (constrainToReasonable) requiredMix = clamp(requiredMix, 0, 1);
    params.binauralMix = requiredMix;
    params.maxAngleDeg = 180;
    params.sensitivity = clamp(params.sensitivity, 0.1, 10);
  }

  const result = computeTranslationWithParams({
    startPos,
    endPos,
    listenerPos,
    listenerYawDeg,
    listenerPitchDeg,
    listenerRollDeg,
    freqHz,
    maxAngleDeg: params.maxAngleDeg,
    sensitivity: params.sensitivity,
    binauralMix: params.binauralMix,
    useBinaural: params.useBinaural,
  });

  return { ...params, resultingPercent: result.percent, rawAngularPercent: raw.angularPercent, rawBinauralWeight: raw.binauralWeight };
}

function translationPercentageOptimized(args) {
  return computeTranslationWithParams(args);
}
function computePerceptualRelevance({
  startPos,
  endPos,
  listenerPos,
  listenerYawDeg = 0,
  listenerPitchDeg = 0,
  listenerRollDeg = 0,
  freqHz = 1000,
  sceneData = {},
  listenerData = {},
  signalData = {},
}) {
  const durationSec = Math.max(0.001, Number(signalData.durationSec ?? 1));
  const maxAngularVelocityDeg = Math.max(1, Number(signalData.maxAngularVelocityDeg ?? 180));
  const maxRadialVelocityMps = Math.max(0.001, Number(signalData.maxRadialVelocityMps ?? 5));
  const angularWeight = Number(signalData.angularWeight ?? 0.35);
  const radialWeight = Number(signalData.radialWeight ?? 0.2);
  const itdWeight = Number(signalData.itdWeight ?? 0.25);
  const ildWeight = Number(signalData.ildWeight ?? 0.2);

  const raw = translationPercentageRaw({
    startPos,
    endPos,
    listenerPos,
    listenerYawDeg,
    listenerPitchDeg,
    listenerRollDeg,
    freqHz,
  });

  const startDistance = distance3D(startPos, listenerPos);
  const endDistance = distance3D(endPos, listenerPos);
  const radialVelocityMps = (endDistance - startDistance) / durationSec;
  const angularVelocityDeg = raw.angularDistDeg / durationSec;

  const angularCue = clamp(angularVelocityDeg / maxAngularVelocityDeg, 0, 1);
  const radialCue = clamp(Math.abs(radialVelocityMps) / maxRadialVelocityMps, 0, 1);
  const itdCue = clamp(raw.itdNorm, 0, 1);
  const ildCue = clamp(raw.ildNorm, 0, 1);

  const weightSum = Math.max(0.001, angularWeight + radialWeight + itdWeight + ildWeight);
  const baseRelevance = clamp(
    (angularCue * angularWeight + radialCue * radialWeight + itdCue * itdWeight + ildCue * ildWeight) / weightSum,
    0,
    1,
  );

  let sceneModulator = 1;
  const sceneComplexity = clamp(Number(sceneData.complexity ?? 0), 0, 1);
  if (sceneComplexity > 0) sceneModulator *= 0.8;
  if (sceneData.reverberation === true) sceneModulator *= 0.9;

  const adaptationState = clamp(Number(listenerData.adaptationState ?? 0), 0, 1);
  const historyModulator = clamp(1 - adaptationState * 0.3, 0.7, 1);

  let loomingBias = 1;
  if (radialVelocityMps < -0.001) loomingBias = 1.2;
  else if (radialVelocityMps > 0.001) loomingBias = 0.8;

  const hearingProfileModulator = clamp(Number(listenerData.hearingProfileModulator ?? 1), 0.2, 1.5);
  const finalRelevance01 = clamp(baseRelevance * sceneModulator * historyModulator * loomingBias * hearingProfileModulator, 0, 1);

  return {
    finalRelevance01,
    finalPercent: finalRelevance01 * 100,
    baseRelevance,
    angularVelocityDeg,
    radialVelocityMps,
    itdChange: itdCue,
    ildChange: ildCue,
    cues: {
      angularCue,
      radialCue,
      itdCue,
      ildCue,
    },
    weights: {
      angularWeight,
      radialWeight,
      itdWeight,
      ildWeight,
    },
    modulators: {
      sceneModulator,
      historyModulator,
      loomingBias,
      hearingProfileModulator,
    },
    context: {
      sceneComplexity,
      reverberation: Boolean(sceneData.reverberation),
      adaptationState,
      startDistance,
      endDistance,
      durationSec,
      freqHz,
    },
  };
}

function roomDimensions() {
  return {
    L: ROOM.yMax - ROOM.yMin,
    W: ROOM.xMax - ROOM.xMin,
    H: ROOM.zMax - ROOM.zMin,
  };
}
function classifyRoomMode(p, q, r) {
  const zeros = [p, q, r].filter((v) => v === 0).length;
  if (zeros === 2) return "Axial";
  if (zeros === 1) return "Tangential";
  return "Oblique";
}
function roomModeFrequency({ p, q, r, c = 343 }) {
  const { L, W, H } = roomDimensions();
  return (c / 2) * Math.sqrt((p / L) ** 2 + (q / W) ** 2 + (r / H) ** 2);
}
function calculateRoomModes({ fTarget = 100, c = 343, tolerancePercent = 1 }) {
  const { L, W, H } = roomDimensions();
  const targetSq = (2 * fTarget / c) ** 2;
  const pMax = Math.floor((2 * fTarget * L) / c) + 2;
  const qMax = Math.floor((2 * fTarget * W) / c) + 2;
  const rMax = Math.floor((2 * fTarget * H) / c) + 2;
  const tolerance = tolerancePercent / 100;
  const matches = [];

  for (let p = 0; p <= pMax; p += 1) {
    for (let q = 0; q <= qMax; q += 1) {
      for (let r = 0; r <= rMax; r += 1) {
        if (p === 0 && q === 0 && r === 0) continue;
        const val = (p / L) ** 2 + (q / W) ** 2 + (r / H) ** 2;
        const diffRatio = Math.abs(val - targetSq) / targetSq;
        const fCalc = (c / 2) * Math.sqrt(val);
        if (diffRatio <= tolerance) {
          matches.push({
            p,
            q,
            r,
            fCalc,
            type: classifyRoomMode(p, q, r),
            errorHz: fCalc - fTarget,
            diffRatio,
          });
        }
      }
    }
  }
  return matches.sort((a, b) => Math.abs(a.errorHz) - Math.abs(b.errorHz));
}
function getLayerStyle(layerDefs, key) { return layerDefs[key] || { name: key, short: key, z: 0, color: "#64748b", count: 0 }; }
function aimTargetPoint(s, len = 1.65) {
  const dx = CENTER.x - s.x, dy = CENTER.y - s.y, dz = CENTER.z - s.z;
  const mag = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  return { x: s.x + (dx / mag) * len, y: s.y + (dy / mag) * len, z: s.z + (dz / mag) * len };
}
function speakerMatchesSide(s, side) {
  if (s.layer === "ceiling" || s.wall === "Ceiling") {
    if (side === "Left") return s.x < 0;
    if (side === "Right") return s.x > 0;
    if (side === "Front") return s.y > 0;
    if (side === "Back") return s.y < 0;
  }
  return s.wall === side;
}
function hasAnyLayerSideFocus(focusMap) {
  return Object.values(focusMap || {}).some((sides) => Object.values(sides || {}).some(Boolean));
}
function speakerMatchesFocusMap(s, focusMap) {
  if (!hasAnyLayerSideFocus(focusMap)) return true;
  const activeSides = Object.entries(focusMap?.[s.layer] || {}).filter(([, active]) => active).map(([side]) => side);
  return activeSides.length > 0 && activeSides.some((side) => speakerMatchesSide(s, side));
}
function focusMapLabel(focusMap) {
  const entries = [];
  Object.entries(focusMap || {}).forEach(([layer, sides]) => Object.entries(sides || {}).forEach(([side, active]) => active && entries.push(`${layer}/${side}`)));
  return entries.length ? entries.join(", ") : "All visible";
}
function hexToRgba(hex, alpha = 0.18) {
  const clean = String(hex || "#64748b").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full || "64748b", 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function getSpeakerSpec(speakerSpecs, layerKey) {
  return speakerSpecs?.[layerKey] || DEFAULT_SPEAKER_SPECS[layerKey] || { model: "Custom speaker", horizontalDeg: 90, verticalDeg: 60, maxDistanceM: 10, spl1mDb: 100 };
}
function normalizeVector(v) {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}
function rotateAroundZ(v, deg) {
  const a = degToRad(deg);
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}
function angleBetweenVectorsDeg(a, b) {
  const na = normalizeVector(a), nb = normalizeVector(b);
  return Math.acos(clamp(na.x * nb.x + na.y * nb.y + na.z * nb.z, -1, 1)) * 180 / Math.PI;
}
function computeCoverageMetrics(speaker, spec, listener) {
  const dist = distance3D(speaker, listener);
  const aim = normalizeVector({ x: CENTER.x - speaker.x, y: CENTER.y - speaker.y, z: CENTER.z - speaker.z });
  const toListener = { x: listener.x - speaker.x, y: listener.y - speaker.y, z: listener.z - speaker.z };
  const offAxisDeg = angleBetweenVectorsDeg(aim, toListener);
  const hHalf = Number(spec.horizontalDeg || 0) / 2;
  const vHalf = Number(spec.verticalDeg || 0) / 2;
  const coverageWidth = 2 * dist * Math.tan(degToRad(hHalf));
  const coverageHeight = 2 * dist * Math.tan(degToRad(vHalf));
  const estimatedSpl = Number(spec.spl1mDb || 0) - 20 * Math.log10(Math.max(1, dist));
  return { dist, offAxisDeg, coverageWidth, coverageHeight, estimatedSpl, inCoverage: offAxisDeg <= Math.max(hHalf, vHalf) };
}
function hueFromSpeaker(sp, layerIndex = 0) {
  return (sp.id * 29 + layerIndex * 67) % 360;
}
function coveragePalette(sp, layerIndex = 0, crowd = false) {
  const hue = hueFromSpeaker(sp, layerIndex);
  const alphaShift = crowd ? -0.04 : 0.02;
  return {
    stroke: `hsla(${hue}, 92%, 48%, 0.95)`,
    fillOuter: `hsla(${hue}, 95%, 62%, ${Math.max(0.08, 0.16 + alphaShift)})`,
    fillMid: `hsla(${(hue + 18) % 360}, 95%, 58%, ${Math.max(0.09, 0.18 + alphaShift)})`,
    fillInner: `hsla(${(hue + 36) % 360}, 96%, 60%, ${Math.max(0.10, 0.22 + alphaShift)})`,
    line: `hsla(${hue}, 95%, 42%, 0.82)`,
  };
}
function crossVec(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function addVec(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function scaleVec(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s }; }
function coverageBasis(forward) {
  const worldUp = Math.abs(forward.z) > 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 };
  const right = normalizeVector(crossVec(forward, worldUp));
  const up = normalizeVector(crossVec(right, forward));
  return { right, up };
}
function buildCoverageFan3D(speaker, forward, horizontalDeg, verticalDeg, distance, steps = 20) {
  const { right, up } = coverageBasis(forward);
  const hHalf = degToRad(horizontalDeg / 2);
  const vHalf = degToRad(verticalDeg / 2);
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const yaw = -hHalf + (i / steps) * (2 * hHalf);
    const dir = normalizeVector(addVec(addVec(scaleVec(forward, 1), scaleVec(right, Math.tan(yaw))), scaleVec(up, -Math.tan(vHalf))));
    points.push({ x: speaker.x + dir.x * distance, y: speaker.y + dir.y * distance, z: clamp(speaker.z + dir.z * distance, ROOM.zMin, ROOM.zMax) });
  }
  for (let i = steps; i >= 0; i -= 1) {
    const yaw = -hHalf + (i / steps) * (2 * hHalf);
    const dir = normalizeVector(addVec(addVec(scaleVec(forward, 1), scaleVec(right, Math.tan(yaw))), scaleVec(up, Math.tan(vHalf))));
    points.push({ x: speaker.x + dir.x * distance, y: speaker.y + dir.y * distance, z: clamp(speaker.z + dir.z * distance, ROOM.zMin, ROOM.zMax) });
  }
  return points;
}
function projectPolygon(points, project) {
  return points.map(project).map((p) => `${p.x},${p.y}`).join(" ");
}
function speakerMatchesCoverageFilter(s, filters = {}) {
  if (s.layer === "ceiling" || s.wall === "Ceiling") {
    if (s.x < -2.2) return filters.overheadLeft !== false;
    if (s.x > 2.2) return filters.overheadRight !== false;
    return filters.overheadCenter !== false;
  }
  if (s.wall === "Left") return filters.left !== false;
  if (s.wall === "Right") return filters.right !== false;
  if (s.wall === "Front") return filters.front !== false;
  if (s.wall === "Back") return filters.bottom !== false;
  return true;
}

function makeProjector({ width, height, zoom, yaw, pitch, view, cameraZ = 0 }) {
  const roomWidth = ROOM.xMax - ROOM.xMin, roomDepth = ROOM.yMax - ROOM.yMin, roomHeight = ROOM.zMax - ROOM.zMin;
  const pad = 92;
  if (view === "top") {
    const scale = Math.min((width - pad * 2) / roomDepth, (height - pad * 2) / roomWidth);
    return (p) => ({ x: width / 2 + p.y * scale, y: height / 2 + p.x * scale, depth: p.z });
  }
  if (view === "front" || view === "back") {
    const scale = Math.min((width - pad * 2) / roomWidth, (height - pad * 2) / roomHeight);
    const flip = view === "back" ? -1 : 1;
    const baseY = height - pad * 0.78;
    return (p) => ({ x: width / 2 + flip * p.x * scale, y: baseY - p.z * scale, depth: view === "front" ? -p.y : p.y });
  }
  if (view === "side") {
    const scale = Math.min((width - pad * 2) / roomDepth, (height - pad * 2) / roomHeight);
    const baseY = height - pad * 0.78;
    return (p) => ({ x: width / 2 + p.y * scale, y: baseY - p.z * scale, depth: -p.x });
  }
  const scale = 31 * zoom;
  const cy = Math.cos(degToRad(yaw)), sy = Math.sin(degToRad(yaw)), cp = Math.cos(degToRad(pitch)), sp = Math.sin(degToRad(pitch));
  return (p) => {
    const xr = p.x * cy - p.y * sy;
    const yr = p.x * sy + p.y * cy;
    const zr = p.z - cameraZ;
    return { x: width / 2 + xr * scale, y: height * 0.66 + yr * cp * scale - zr * sp * scale, depth: yr + zr * 0.18 };
  };
}
function screenDeltaToXYDelta({ dx, dy, view, project, listener }) {
  // Converts mouse movement in screen pixels into listener X/Y movement in meters.
  // Z stays locked at listener head height.
  if (view === "top" || view === "iso") {
    const origin = project(listener);
    const xAxis = project({ ...listener, x: listener.x + 1 });
    const yAxis = project({ ...listener, y: listener.y + 1 });
    const ax = xAxis.x - origin.x, ay = xAxis.y - origin.y;
    const bx = yAxis.x - origin.x, by = yAxis.y - origin.y;
    const det = ax * by - ay * bx;
    if (Math.abs(det) > 0.0001) {
      return {
        x: (dx * by - dy * bx) / det,
        y: (ax * dy - ay * dx) / det,
      };
    }
  }

  // Front/back views hide Y depth visually, so vertical mouse movement is used as depth movement.
  if (view === "front" || view === "back") {
    const scale = (1280 - 92 * 2) / (ROOM.xMax - ROOM.xMin);
    const flip = view === "back" ? -1 : 1;
    return { x: (dx / scale) * flip, y: -dy / scale };
  }

  // Side view shows Y horizontally, so vertical mouse movement becomes X depth movement.
  if (view === "side") {
    const scale = (1280 - 92 * 2) / (ROOM.yMax - ROOM.yMin);
    return { x: -dy / scale, y: dx / scale };
  }

  return { x: 0, y: 0 };
}

function runInternalTests() {
  console.assert(speakerMatchesSide({ layer: "ceiling", wall: "Ceiling", x: -1, y: 0 }, "Left") === true, "Ceiling L test failed");
  console.assert(speakerMatchesFocusMap({ layer: "ceiling", wall: "Ceiling", x: -1, y: 0 }, { ceiling: { Left: true } }) === true, "Focus map test failed");
  console.assert(speakerMatchesFocusMap({ layer: "upper", wall: "Right", x: 6.7, y: 0 }, { upper: { Left: true } }) === false, "Wall focus rejection failed");
  console.assert(Math.abs(angleBetweenSpeakersFromListener({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }) - 90) < 0.001, "DBAP angle test failed");
  console.assert(findDBAPTriangle({ x: 0, y: 0, z: 0 }, [{ id: 1, x: 1, y: 0, z: 0 }, { id: 2, x: 2, y: 0, z: 0 }, { id: 3, x: 3, y: 0, z: 0 }, { id: 4, x: 4, y: 0, z: 0 }]).length === 3, "DBAP triangle test failed");
  console.assert(translationPercentageOptimized({ startPos: { x: 0, y: 1, z: 1 }, endPos: { x: 1, y: 1, z: 1 }, listenerPos: { x: 0, y: 0, z: 1 }, listenerYawDeg: 0 }).percent >= 0, "Translation percentage test failed");
  console.assert(classifyRoomMode(1, 0, 0) === "Axial", "Axial mode classification failed");
  console.assert(classifyRoomMode(1, 1, 0) === "Tangential", "Tangential mode classification failed");
  console.assert(classifyRoomMode(1, 1, 1) === "Oblique", "Oblique mode classification failed");
  console.assert(computePerceptualRelevance({ startPos: { x: 0, y: 1, z: 1 }, endPos: { x: 1, y: 1, z: 1 }, listenerPos: { x: 0, y: 0, z: 1 } }).finalPercent >= 0, "Perceptual relevance diagnostic test failed");
}

function LayerBox({ layerKey, layerDefs, count, active, onToggle, focusMap, onSideFocus }) {
  const layer = getLayerStyle(layerDefs, layerKey);
  return (
    <div className={`rounded-lg border p-1.5 transition ${active ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50 opacity-55"}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: layer.color }} /><span><span className="block text-[10px] font-black text-slate-950">{layer.short || layer.name || layerKey}</span><span className="block text-[9px] text-slate-500">Z {Number(layer.z || 0).toFixed(1)} · {count}</span></span></span>
        <span className="text-[10px] font-semibold text-slate-500">{active ? "ON" : "OFF"}</span>
      </button>
      <div className="mt-1 grid grid-cols-2 gap-0.5">
        {SIDES.map(([side, label]) => {
          const isActive = Boolean(focusMap?.[layerKey]?.[side]);
          return <button key={side} onClick={() => onSideFocus(layerKey, side)} className={`rounded border py-0.5 text-[9px] font-black ${isActive ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{label}</button>;
        })}
      </div>
    </div>
  );
}

function TopControlStrip({ speakerData, layerDefs, activeLayers, setActiveLayers, focusMap, setFocusMap, onSideFocus }) {
  const layerCounts = useMemo(() => speakerData.reduce((acc, s) => ({ ...acc, [s.layer]: (acc[s.layer] || 0) + 1 }), {}), [speakerData]);
  return (
    <div className="grid gap-2">
      {Object.keys(layerDefs).map((key) => <LayerBox key={key} layerKey={key} layerDefs={layerDefs} count={layerCounts[key] || 0} active={activeLayers[key] !== false} onToggle={() => setActiveLayers((v) => ({ ...v, [key]: !(v[key] !== false) }))} focusMap={focusMap} onSideFocus={onSideFocus} />)}
      <Card className="rounded-lg border-slate-200 bg-white shadow-sm"><CardContent className="p-2 text-[11px] leading-snug text-slate-600"><div className="mb-1 flex items-center justify-between gap-2 font-black text-slate-900"><span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5 text-sky-600" /> Reference</span>{hasAnyLayerSideFocus(focusMap) && <button onClick={() => setFocusMap({})} className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800">ALL</button>}</div><p><b>0°</b> = front wall Y +10.75 m.</p><p><b>L/R/F/B</b> multi-selects layer sides.</p></CardContent></Card>
    </div>
  );
}

function DimensionLine({ p1, p2, label, project, offset = { x: 0, y: 0 } }) {
  const a = project(p1), b = project(p2);
  const mx = (a.x + b.x) / 2 + offset.x, my = (a.y + b.y) / 2 + offset.y;
  return <g><line x1={a.x + offset.x} y1={a.y + offset.y} x2={b.x + offset.x} y2={b.y + offset.y} stroke="#0f172a" strokeWidth="1.15" strokeDasharray="5 4" markerStart="url(#arrowDim)" markerEnd="url(#arrowDim)" opacity="0.75" /><text x={mx} y={my - 10} textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="950">{label}</text></g>;
}
function Speaker3D({ s, layerDefs, project, selected, setSelected, showAim, focusActive, focusMatch }) {
  const layer = getLayerStyle(layerDefs, s.layer), p = project(s), target = project(aimTargetPoint(s));
  return <g onPointerDown={(e) => e.stopPropagation()} onClick={() => setSelected(s)} className="cursor-pointer" opacity={focusActive && !focusMatch ? 0.22 : 1}>{showAim && <line x1={p.x} y1={p.y} x2={target.x} y2={target.y} stroke="#0f172a" strokeWidth={selected ? 2.2 : 1.4} opacity={selected ? 0.9 : 0.55} markerEnd="url(#arrowAim)" />}<circle cx={p.x} cy={p.y} r={selected ? 7.5 : 6} fill={layer.color} /></g>;
}

function Room3D({ speakerData, layerDefs, activeLayers, showAim, showIcosa, showDBAP, showRoomModes, showCoverage, coverageScope, coverageFilters, coveragePreviewLayer, speakerSpecs, selectedRoomMode, view, selected, setSelected, focusMap, listener, setListener, soundObject, setSoundObject }) {
  const width = 1280, height = 720;
  const [yaw, setYaw] = useState(-38), [pitch, setPitch] = useState(56), [zoom, setZoom] = useState(1), [targetZoom, setTargetZoom] = useState(1), [drag, setDrag] = useState(false), [listenerDrag, setListenerDrag] = useState(false), [soundDrag, setSoundDrag] = useState(false);
  useEffect(() => { const h = (e) => e.key === "Escape" && setDrag(false); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  useEffect(() => { let frame; const step = () => { setZoom((z) => { const d = targetZoom - z; if (Math.abs(d) < 0.0015) return targetZoom; frame = requestAnimationFrame(step); return z + d * 0.14; }); }; frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame); }, [targetZoom]);
  const resetIsActive = showIcosa || showDBAP || showRoomModes || showCoverage || hasAnyLayerSideFocus(focusMap) || Math.abs(yaw + 38) > 0.5 || Math.abs(pitch - 56) > 0.5 || Math.abs(targetZoom - 1) > 0.02;
  const resetLayoutView = () => { setYaw(-38); setPitch(56); setZoom(1); setTargetZoom(1); setDrag(false); setListenerDrag(false); setSoundDrag(false); };
  const project = useMemo(() => makeProjector({ width, height, yaw, pitch, zoom: view === "iso" ? zoom : 1, view }), [width, height, yaw, pitch, zoom, view]);
  const visible = speakerData.filter((s) => activeLayers[s.layer] !== false).map((s) => ({ ...s, _p: project(s) })).sort((a, b) => a._p.depth - b._p.depth);
  const focusActive = hasAnyLayerSideFocus(focusMap);
  const related = useMemo(() => focusActive ? visible.filter((s) => speakerMatchesFocusMap(s, focusMap)) : visible, [focusActive, visible, focusMap]);
  const dbapTriangle = useMemo(() => showDBAP ? findDBAPTriangle(soundObject, related) : [], [showDBAP, soundObject, related]);
  const coverageSpeakers = useMemo(() => {
    if (!showCoverage) return [];
    const previewFiltered = coveragePreviewLayer && coveragePreviewLayer !== "all"
      ? related.filter((s) => s.layer === coveragePreviewLayer)
      : related;
    const filteredRelated = previewFiltered.filter((s) => speakerMatchesCoverageFilter(s, coverageFilters));
    if (coverageScope === "visible") return filteredRelated;
    const focusedSelected = filteredRelated.find((s) => s.id === selected?.id) || visible.find((s) => s.id === selected?.id && speakerMatchesCoverageFilter(s, coverageFilters));
    return focusedSelected ? [focusedSelected] : [];
  }, [showCoverage, coverageScope, coverageFilters, coveragePreviewLayer, related, visible, selected]);
  const links = useMemo(() => {
    if (!showIcosa || related.length < 2) return [];
    const avgR = related.reduce((sum, s) => sum + distance3D(s, CENTER), 0) / related.length;
    const side = (4 * avgR) / Math.sqrt(10 + 2 * Math.sqrt(5));
    const out = [];
    for (let i = 0; i < related.length; i++) for (let j = i + 1; j < related.length; j++) { const d = distance3D(related[i], related[j]); if (d >= side * 0.58 && d <= side * 1.42) out.push({ a: related[i], b: related[j], score: Math.abs(d - side) }); }
    return out.sort((a, b) => a.score - b.score).slice(0, Math.min(90, related.length * 3));
  }, [showIcosa, related]);
  const roomCorners = CORNERS.slice(0, 8);
  const grid = [];
  for (let x = Math.ceil(ROOM.xMin); x <= Math.floor(ROOM.xMax); x++) grid.push([{ x, y: ROOM.yMin, z: 0 }, { x, y: ROOM.yMax, z: 0 }]);
  for (let y = Math.ceil(ROOM.yMin); y <= Math.floor(ROOM.yMax); y++) grid.push([{ x: ROOM.xMin, y, z: 0 }, { x: ROOM.xMax, y, z: 0 }]);
  const plane = (z, color, key) => { const pts = [{ x: ROOM.xMin, y: ROOM.yMin, z }, { x: ROOM.xMax, y: ROOM.yMin, z }, { x: ROOM.xMax, y: ROOM.yMax, z }, { x: ROOM.xMin, y: ROOM.yMax, z }].map(project).map((p) => `${p.x},${p.y}`).join(" "); return <polygon key={key} points={pts} fill={color} opacity="0.28" stroke={color} strokeDasharray="10 5" strokeWidth="3.2" />; };
  const roomModeSurfaces = () => {
    if (!showRoomModes || !selectedRoomMode) return null;
    const pOrder = Number(selectedRoomMode.p || 0);
    const qOrder = Number(selectedRoomMode.q || 0);
    const rOrder = Number(selectedRoomMode.r || 0);
    const surfaces = [];
    const makePoly = (points, key, fill, stroke) => {
      const pts = points.map(project).map((p) => `${p.x},${p.y}`).join(" ");
      return <polygon key={key} points={pts} fill={fill} stroke={stroke} strokeWidth="3" strokeDasharray="9 5" opacity="0.72" />;
    };

    for (let i = 1; i < qOrder; i += 1) {
      const x = ROOM.xMin + (i / qOrder) * (ROOM.xMax - ROOM.xMin);
      surfaces.push(makePoly([{ x, y: ROOM.yMin, z: ROOM.zMin }, { x, y: ROOM.yMax, z: ROOM.zMin }, { x, y: ROOM.yMax, z: ROOM.zMax }, { x, y: ROOM.yMin, z: ROOM.zMax }], `mode-q-${i}`, "rgba(37,99,235,0.18)", "#1d4ed8"));
    }
    for (let i = 1; i < pOrder; i += 1) {
      const y = ROOM.yMin + (i / pOrder) * (ROOM.yMax - ROOM.yMin);
      surfaces.push(makePoly([{ x: ROOM.xMin, y, z: ROOM.zMin }, { x: ROOM.xMax, y, z: ROOM.zMin }, { x: ROOM.xMax, y, z: ROOM.zMax }, { x: ROOM.xMin, y, z: ROOM.zMax }], `mode-p-${i}`, "rgba(14,165,233,0.18)", "#0284c7"));
    }
    for (let i = 1; i < rOrder; i += 1) {
      const z = ROOM.zMin + (i / rOrder) * (ROOM.zMax - ROOM.zMin);
      surfaces.push(makePoly([{ x: ROOM.xMin, y: ROOM.yMin, z }, { x: ROOM.xMax, y: ROOM.yMin, z }, { x: ROOM.xMax, y: ROOM.yMax, z }, { x: ROOM.xMin, y: ROOM.yMax, z }], `mode-r-${i}`, "rgba(59,130,246,0.16)", "#2563eb"));
    }
    return <g style={{ filter: "drop-shadow(0 0 10px rgba(37,99,235,0.45))" }}>{surfaces}</g>;
  };
  const coverageSurfaces = () => {
    if (!showCoverage) return null;
    const crowd = coverageScope === "visible";
    return (
      <g style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.12))" }}>
        {coverageSpeakers.map((sp, index) => {
          const spec = getSpeakerSpec(speakerSpecs, sp.layer);
          const layerKeys = Object.keys(layerDefs || DEFAULT_LAYERS);
          const layerIndex = Math.max(0, layerKeys.indexOf(sp.layer));
          const palette = coveragePalette(sp, layerIndex, crowd);
          const forward = normalizeVector({ x: CENTER.x - sp.x, y: CENTER.y - sp.y, z: CENTER.z - sp.z });
          const throwDist = Math.max(0.5, Number(spec.maxDistanceM || 10));

          const outer3D = buildCoverageFan3D(sp, forward, Number(spec.horizontalDeg || 90), Number(spec.verticalDeg || 60), throwDist, 20);
          const mid3D = buildCoverageFan3D(sp, forward, Number(spec.horizontalDeg || 90) * 0.84, Number(spec.verticalDeg || 60) * 0.84, throwDist * 0.82, 20);
          const inner3D = buildCoverageFan3D(sp, forward, Number(spec.horizontalDeg || 90) * 0.68, Number(spec.verticalDeg || 60) * 0.68, throwDist * 0.62, 20);

          const p0 = project(sp);
          const pForward = project({ x: sp.x + forward.x * throwDist, y: sp.y + forward.y * throwDist, z: clamp(sp.z + forward.z * throwDist, ROOM.zMin, ROOM.zMax) });
          const outerEdgeA = project(outer3D[0]);
          const outerEdgeB = project(outer3D[Math.floor(outer3D.length / 2) - 1]);
          const outerEdgeC = project(outer3D[Math.floor(outer3D.length / 2)]);
          const outerEdgeD = project(outer3D[outer3D.length - 1]);

          return (
            <g key={`coverage-${sp.id}-${index}`} opacity={crowd ? 0.82 : 0.98}>
              <polygon points={projectPolygon(outer3D, project)} fill={palette.fillOuter} stroke={palette.stroke} strokeWidth={crowd ? 0.95 : 1.35} />
              <polygon points={projectPolygon(mid3D, project)} fill={palette.fillMid} stroke={palette.stroke} strokeWidth={crowd ? 0.85 : 1.12} />
              <polygon points={projectPolygon(inner3D, project)} fill={palette.fillInner} stroke={palette.stroke} strokeWidth={crowd ? 0.75 : 1} />
              <line x1={p0.x} y1={p0.y} x2={outerEdgeA.x} y2={outerEdgeA.y} stroke={palette.line} strokeWidth="1" opacity="0.65" />
              <line x1={p0.x} y1={p0.y} x2={outerEdgeB.x} y2={outerEdgeB.y} stroke={palette.line} strokeWidth="1" opacity="0.5" />
              <line x1={p0.x} y1={p0.y} x2={outerEdgeC.x} y2={outerEdgeC.y} stroke={palette.line} strokeWidth="1" opacity="0.5" />
              <line x1={p0.x} y1={p0.y} x2={outerEdgeD.x} y2={outerEdgeD.y} stroke={palette.line} strokeWidth="1" opacity="0.65" />
              <line x1={p0.x} y1={p0.y} x2={pForward.x} y2={pForward.y} stroke={palette.line} strokeWidth="1.25" strokeDasharray="5 4" opacity="0.78" />
            </g>
          );
        })}
      </g>
    );
  };
  return <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xl shadow-slate-200/70"><CardContent className="p-0"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"><div className="flex items-center gap-2 text-sm font-black tracking-wide text-slate-900"><Box className="h-4 w-4 text-sky-600" /> Dimensional 3D Layout View</div><div className="flex items-center gap-2 text-xs font-black text-sky-700"><Move className="h-3.5 w-3.5" /> 3D Layout: click and move · Esc to exit</div></div><svg viewBox={`0 0 ${width} ${height}`} className="aspect-video w-full cursor-grab bg-[radial-gradient(circle_at_45%_22%,rgba(14,165,233,0.10),transparent_40%),linear-gradient(180deg,#ffffff,#f8fafc)] active:cursor-grabbing" onPointerDown={(e) => { if (view === "iso") { e.currentTarget.setPointerCapture?.(e.pointerId); setDrag(true); } }} onPointerMove={(e) => { if (soundDrag) { const delta = screenDeltaToXYDelta({ dx: e.movementX, dy: e.movementY, view, project, listener: soundObject }); setSoundObject((o) => ({ ...o, x: clamp(o.x + delta.x, ROOM.xMin, ROOM.xMax), y: clamp(o.y + delta.y, ROOM.yMin, ROOM.yMax) })); } else if (listenerDrag) { const delta = screenDeltaToXYDelta({ dx: e.movementX, dy: e.movementY, view, project, listener }); setListener((l) => ({ ...l, x: clamp(l.x + delta.x, ROOM.xMin, ROOM.xMax), y: clamp(l.y + delta.y, ROOM.yMin, ROOM.yMax), z: LISTENER_HEIGHT_M })); } else if (drag && view === "iso") { setYaw((v) => v - e.movementX * 0.42); setPitch((v) => v - e.movementY * 0.34); } }} onPointerUp={() => { setDrag(false); setListenerDrag(false); setSoundDrag(false); }} onPointerCancel={() => { setDrag(false); setListenerDrag(false); setSoundDrag(false); }} onPointerLeave={() => { setDrag(false); setListenerDrag(false); setSoundDrag(false); }} onWheel={(e) => { e.preventDefault(); if (view === "iso") setTargetZoom((z) => Math.max(0.35, Math.min(4, z + (e.deltaY > 0 ? -0.06 : 0.06)))); }}><defs><marker id="arrowAim" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" fill="#0f172a" /></marker><marker id="arrowDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,4 L8,0 L6,4 L8,8 z" fill="#0f172a" /></marker></defs><g opacity="0.35">{grid.map(([a,b],i) => { const pa = project(a), pb = project(b); return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#cbd5e1" strokeWidth="0.8" />; })}</g>{Object.entries(layerDefs).map(([k, l]) => activeLayers[k] !== false && plane(Number(l.z || 0), l.color || "#64748b", k))}<g>{ROOM_EDGES.map(([i,j],idx) => { const a = project(roomCorners[i]), b = project(roomCorners[j]); return <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#334155" strokeWidth="1.5" opacity="0.75" />; })}</g>{roomModeSurfaces()}{coverageSurfaces()}{showIcosa && <g opacity="0.92">{links.map((l, i) => { const a = project(l.a), b = project(l.b); return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#001f5b" strokeWidth="2.4" strokeLinecap="round" opacity="0.84" />; })}</g>}{showDBAP && dbapTriangle.length === 3 && <g style={{ filter: "drop-shadow(0 0 10px rgba(168,85,247,0.55))" }}>{(() => { const pts = dbapTriangle.map(project); return <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="rgba(168,85,247,0.13)" stroke="#7c3aed" strokeWidth="3" strokeLinejoin="round" />; })()}{dbapTriangle.map((sp) => { const p = project(sp); return <line key={`dbap-line-${sp.id}`} x1={project(soundObject).x} y1={project(soundObject).y} x2={p.x} y2={p.y} stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />; })}</g>}<DimensionLine project={project} p1={{ x: ROOM.xMin, y: ROOM.yMin, z: -0.12 }} p2={{ x: ROOM.xMax, y: ROOM.yMin, z: -0.12 }} label="13.40 m X" offset={{ x: 0, y: 34 }} /><DimensionLine project={project} p1={{ x: ROOM.xMax, y: ROOM.yMin, z: -0.18 }} p2={{ x: ROOM.xMax, y: ROOM.yMax, z: -0.18 }} label="21.50 m Y" offset={{ x: 42, y: 26 }} /><DimensionLine project={project} p1={{ x: ROOM.xMax, y: ROOM.yMax, z: ROOM.zMin }} p2={{ x: ROOM.xMax, y: ROOM.yMax, z: ROOM.zMax }} label="7.20 m Z" offset={{ x: 34, y: 0 }} />{visible.map((s) => <Speaker3D key={s.id} s={s} layerDefs={layerDefs} project={project} selected={selected?.id === s.id} setSelected={setSelected} showAim={showAim} focusActive={focusActive} focusMatch={speakerMatchesFocusMap(s, focusMap)} />)}{(() => { const lp = project(listener); return <g className="cursor-move" onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.ownerSVGElement?.setPointerCapture?.(e.pointerId); setListenerDrag(true); }} style={{ filter: "drop-shadow(0 0 10px rgba(15,23,42,0.35))" }}><circle cx={lp.x} cy={lp.y} r="17" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" opacity="0.95" /><circle cx={lp.x} cy={lp.y} r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" /><circle cx={lp.x} cy={lp.y - 3} r="5.5" fill="#0f172a" /><path d={`M ${lp.x - 8} ${lp.y + 10} Q ${lp.x} ${lp.y + 2} ${lp.x + 8} ${lp.y + 10}`} fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" /><text x={lp.x} y={lp.y + 32} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="900">Drag Listener</text></g>; })()}{showDBAP && (() => { const op = project(soundObject); return <g className="cursor-move" onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.ownerSVGElement?.setPointerCapture?.(e.pointerId); setSoundDrag(true); }} style={{ filter: "drop-shadow(0 0 12px rgba(168,85,247,0.75))" }}><circle cx={op.x} cy={op.y} r="18" fill="rgba(168,85,247,0.18)" stroke="#7c3aed" strokeWidth="3" /><circle cx={op.x} cy={op.y} r="8" fill="#a855f7" stroke="#ffffff" strokeWidth="2" /><text x={op.x} y={op.y + 32} textAnchor="middle" fill="#581c87" fontSize="11" fontWeight="950">DBAP Object</text></g>; })()}<foreignObject x={width - 168} y="18" width="150" height="46"><button xmlns="http://www.w3.org/1999/xhtml" onClick={resetLayoutView} className={`h-10 w-full rounded-xl border border-slate-300 bg-white text-xs font-black text-slate-950 shadow-sm hover:bg-slate-100 ${resetIsActive ? "animate-pulse ring-2 ring-sky-300" : ""}`}>Reset View</button></foreignObject><rect x="18" y="18" width="330" height="66" rx="12" fill="rgba(255,255,255,0.86)" stroke="#bae6fd" strokeWidth="1" /><text x="34" y="42" fill="#0f172a" fontSize="13" fontWeight="900">{view.toUpperCase()} VIEW</text><text x="34" y="63" fill="#0369a1" fontSize="12" fontWeight="900">Click + move for smooth free rotation · ESC exits</text>{showRoomModes && selectedRoomMode && <text x="34" y="84" fill="#1d4ed8" fontSize="12" fontWeight="900">Room Mode: ({selectedRoomMode.p}, {selectedRoomMode.q}, {selectedRoomMode.r}) · {selectedRoomMode.type} · {selectedRoomMode.fCalc.toFixed(2)} Hz</text>}{showCoverage && coveragePreviewLayer && <text x="34" y={showRoomModes ? 103 : 84} fill="#be185d" fontSize="12" fontWeight="950">Coverage preview: {coveragePreviewLayer === "all" ? "All speakers" : getLayerStyle(layerDefs, coveragePreviewLayer).short}</text>}{focusActive && <text x="34" y={showRoomModes || (showCoverage && coveragePreviewLayer) ? 122 : 84} fill="#0369a1" fontSize="12" fontWeight="800">Focus: {focusMapLabel(focusMap)}</text>}</svg></CardContent></Card>;
}

function NavigationBar({ view, setView, showAim, setShowAim }) {
  const buttons = [["iso", "3D"], ["top", "Top"], ["side", "Side"], ["front", "Front"], ["back", "Back"]];
  return <Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-2"><div className="mb-2 flex items-center gap-1 text-xs font-black text-slate-900"><MousePointer2 className="h-3.5 w-3.5 text-sky-600" /> Navigation</div><div className="grid grid-cols-2 gap-1">{buttons.map(([k, label]) => <button key={k} onClick={() => setView(k)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-black ${view === k ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>{label}</button>)}</div><Button variant="outline" size="sm" className="mt-2 h-8 w-full border-slate-300 bg-white px-2 text-[11px] text-slate-950 hover:bg-slate-100" onClick={() => setShowAim((v) => !v)}><Crosshair className="mr-1 h-3.5 w-3.5" /> Aim</Button></CardContent></Card>;
}

function RoomModesPanel({ showRoomModes, setShowRoomModes, selectedRoomMode, setSelectedRoomMode, helpActive }) {
  const [fTarget, setFTarget] = useState(100);
  const [speed, setSpeed] = useState(343);
  const [tolerancePercent, setTolerancePercent] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modeType, setModeType] = useState("Axial");
  const dims = roomDimensions();
  const modes = useMemo(() => calculateRoomModes({ fTarget, c: speed, tolerancePercent }), [fTarget, speed, tolerancePercent]);
  const filteredModes = useMemo(() => modes.filter((m) => m.type === modeType), [modes, modeType]);
  const selectedMode = filteredModes[selectedIndex] || filteredModes[0] || modes[0] || { p: 1, q: 0, r: 0, fCalc: 0, type: "Axial", errorHz: 0 };
  useEffect(() => {
    if (filteredModes[selectedIndex]) setSelectedRoomMode(filteredModes[selectedIndex]);
    else if (filteredModes[0]) setSelectedRoomMode(filteredModes[0]);
    else if (modes[0]) setSelectedRoomMode(modes[0]);
  }, [filteredModes, modes, selectedIndex, setSelectedRoomMode]);

  const width = 760;
  const height = 310;
  const pad = 42;
  const planW = 330;
  const elevW = 330;
  const planH = 220;
  const sxPlan = (x) => pad + (x / dims.W) * planW;
  const syPlan = (y) => pad + ((dims.L - y) / dims.L) * planH;
  const sxElev = (x) => pad + planW + 70 + (x / dims.W) * elevW;
  const szElev = (z) => pad + ((dims.H - z) / dims.H) * planH;

  const verticalBands = [];
  const horizontalBands = [];
  const heightBands = [];
  for (let i = 1; i < selectedMode.q; i += 1) verticalBands.push((i / selectedMode.q) * dims.W);
  for (let i = 1; i < selectedMode.p; i += 1) horizontalBands.push((i / selectedMode.p) * dims.L);
  for (let i = 1; i < selectedMode.r; i += 1) heightBands.push((i / selectedMode.r) * dims.H);

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 grid gap-2 md:grid-cols-4">
          <button onClick={() => setShowRoomModes((v) => !v)} className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${showRoomModes ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-300 bg-white text-slate-900"}`}>Show in Main 3D Layout<HelpTip id="showRoomModes" active={helpActive} /></button>
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Target frequency<HelpTip id="roomTargetFrequency" active={helpActive} />
            <input type="number" value={fTarget} min="1" step="1" onChange={(e) => { setFTarget(Number(e.target.value || 1)); setSelectedIndex(0); }} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Speed of sound<HelpTip id="roomSpeed" active={helpActive} />
            <input type="number" value={speed} min="300" step="1" onChange={(e) => { setSpeed(Number(e.target.value || 343)); setSelectedIndex(0); }} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Tolerance %<HelpTip id="roomTolerance" active={helpActive} />
            <input type="number" value={tolerancePercent} min="0.1" max="20" step="0.1" onChange={(e) => { setTolerancePercent(Number(e.target.value || 1)); setSelectedIndex(0); }} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950" />
          </label>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border border-slate-200 bg-white">
          <defs>
            <linearGradient id="modeGrad" x1="0" x2="1">
              <stop offset="0" stopColor="#dbeafe" />
              <stop offset="0.5" stopColor="#2563eb" />
              <stop offset="1" stopColor="#dbeafe" />
            </linearGradient>
          </defs>
          

          <rect x={pad} y={pad} width={planW} height={planH} fill="url(#modeGrad)" opacity="0.18" stroke="#0f172a" strokeWidth="1.8" />
          <rect x={pad + planW + 70} y={pad} width={elevW} height={planH} fill="url(#modeGrad)" opacity="0.18" stroke="#0f172a" strokeWidth="1.8" />

          {verticalBands.map((x, idx) => <line key={`vx-${idx}`} x1={sxPlan(x)} y1={pad} x2={sxPlan(x)} y2={pad + planH} stroke="#1d4ed8" strokeWidth="3" strokeDasharray="8 5" />)}
          {horizontalBands.map((y, idx) => <line key={`hy-${idx}`} x1={pad} y1={syPlan(y)} x2={pad + planW} y2={syPlan(y)} stroke="#1d4ed8" strokeWidth="3" strokeDasharray="8 5" />)}
          {heightBands.map((z, idx) => <line key={`hz-${idx}`} x1={pad + planW + 70} y1={szElev(z)} x2={pad + planW + 70 + elevW} y2={szElev(z)} stroke="#1d4ed8" strokeWidth="3" strokeDasharray="8 5" />)}

          <text x={pad + planW / 2} y={pad + planH + 28} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="950">Room plan: {dims.W.toFixed(1)}m × {dims.L.toFixed(1)}m</text>
          <text x={pad + planW + 70 + elevW / 2} y={pad + planH + 28} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="950">Height: {dims.H.toFixed(1)}m</text>
          <text x={width / 2} y={height - 18} textAnchor="middle" fill="#1e3a8a" fontSize="14" fontWeight="950">Selected mode: ({selectedMode.p}, {selectedMode.q}, {selectedMode.r}) · {selectedMode.type} · {selectedMode.fCalc.toFixed(2)} Hz</text>
        </svg>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 text-sm font-black text-slate-900">Integer mode matches</div>
        <div className="mb-2 grid grid-cols-1 gap-1">
          {[["Axial", "Axial modes p"], ["Tangential", "Tangential modes q"], ["Oblique", "Oblique modes r"]].map(([key, label]) => (
            <button key={key} onClick={() => { setModeType(key); setSelectedIndex(0); }} className={`rounded-lg border px-2 py-1.5 text-left text-[11px] font-black ${modeType === key ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>{label}</button>
          ))}
        </div>
        <div className="mb-2 rounded-lg bg-slate-50 p-2 font-mono text-[10px] leading-snug text-slate-700">f = (c/2) · √[(p/L)² + (q/W)² + (r/H)²]</div>
        <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
          {filteredModes.length ? filteredModes.map((m, idx) => (
            <button key={`${m.p}-${m.q}-${m.r}-${idx}`} onClick={() => { setSelectedIndex(idx); setSelectedRoomMode(m); }} className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 ${idx === selectedIndex ? "bg-blue-50 text-blue-950" : "bg-white hover:bg-slate-50"}`}>
              <div className="font-black">p={m.p}, q={m.q}, r={m.r} · {m.type}</div>
              <div>{m.fCalc.toFixed(2)} Hz · error {m.errorHz.toFixed(2)} Hz</div>
            </button>
          )) : <div className="p-3 text-xs font-semibold text-slate-500">No {modeType.toLowerCase()} mode matches within tolerance.</div>}
        </div>
      </div>
    </div>
  );
}

function CoveragePanel({
  showCoverage,
  setShowCoverage,
  coverageScope,
  setCoverageScope,
  coverageFilters,
  setCoverageFilters,
  speakerSpecs,
  setSpeakerSpecs,
  layerDefs,
  selected,
  listener,
  helpActive,
}) {
  const layerKeys = Object.keys(layerDefs || DEFAULT_LAYERS);
  const [editLayer, setEditLayer] = useState(selected?.layer || layerKeys[0] || "ceiling");

  useEffect(() => {
    if (selected?.layer) setEditLayer(selected.layer);
  }, [selected?.layer]);

  const spec = getSpeakerSpec(speakerSpecs, editLayer);
  const selectedSpec = selected ? getSpeakerSpec(speakerSpecs, selected.layer) : spec;
  const metrics = selected ? computeCoverageMetrics(selected, selectedSpec, listener) : null;

  const updateSpec = (field, value) => {
    setSpeakerSpecs((prev) => ({
      ...prev,
      [editLayer]: {
        ...getSpeakerSpec(prev, editLayer),
        [field]: value,
      },
    }));
  };
  const coverageToggleGroups = [
    { key: "left", label: "Left" },
    { key: "right", label: "Right" },
    { key: "front", label: "Front" },
    { key: "bottom", label: "Bottom / Back" },
    { key: "overheadLeft", label: "Overhead L" },
    { key: "overheadCenter", label: "Overhead C" },
    { key: "overheadRight", label: "Overhead R" },
  ];
  const toggleCoverageFilter = (key) => {
    setCoverageFilters((prev) => ({ ...prev, [key]: !(prev?.[key] !== false) }));
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-black text-slate-900">Speaker Specs Input</div>
          <button
            onClick={() => setShowCoverage((v) => !v)}
            className={`rounded-xl border px-3 py-2 text-xs font-black ${showCoverage ? "border-cyan-500 bg-cyan-50 text-cyan-950" : "border-slate-300 bg-white text-slate-900"}`}
          >
            Show Coverage
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-2">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Coverage groups on/off</div>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
            {coverageToggleGroups.map((item) => {
              const active = coverageFilters?.[item.key] !== false;
              return (
                <button
                  key={item.key}
                  onClick={() => toggleCoverageFilter(item.key)}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-black ${active ? "border-fuchsia-400 bg-fuchsia-50 text-fuchsia-900" : "border-slate-200 bg-slate-50 text-slate-400"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Layer
            <select
              value={editLayer}
              onChange={(e) => setEditLayer(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            >
              {layerKeys.map((key) => {
                const layer = getLayerStyle(layerDefs, key);
                return (
                  <option key={key} value={key}>
                    {layer.short || layer.name || key}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Model / box type
            <input
              value={spec.model || ""}
              onChange={(e) => updateSpec("model", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            />
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Coverage scope
            <HelpTip id="coverageScope" active={helpActive} />
            <select
              value={coverageScope}
              onChange={(e) => setCoverageScope(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            >
              <option value="selected">Selected speaker</option>
              <option value="visible">Visible / focused speakers</option>
            </select>
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Horizontal °
            <HelpTip id="coverageHorizontal" active={helpActive} />
            <input
              type="number"
              min="1"
              max="180"
              step="1"
              value={spec.horizontalDeg}
              onChange={(e) => updateSpec("horizontalDeg", clamp(Number(e.target.value || 90), 1, 180))}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            />
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Vertical °
            <HelpTip id="coverageVertical" active={helpActive} />
            <input
              type="number"
              min="1"
              max="180"
              step="1"
              value={spec.verticalDeg}
              onChange={(e) => updateSpec("verticalDeg", clamp(Number(e.target.value || 60), 1, 180))}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            />
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Throw m
            <HelpTip id="coverageDistance" active={helpActive} />
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={spec.maxDistanceM}
              onChange={(e) => updateSpec("maxDistanceM", clamp(Number(e.target.value || 10), 0.5, 50))}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            />
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            SPL @1m
            <HelpTip id="coverageSpl" active={helpActive} />
            <input
              type="number"
              min="60"
              max="150"
              step="1"
              value={spec.spl1mDb}
              onChange={(e) => updateSpec("spl1mDb", clamp(Number(e.target.value || 100), 60, 150))}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-black text-slate-950"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
        <div className="text-sm font-black text-cyan-950">Coverage Check</div>
        {metrics ? (
          <div className="mt-2 grid gap-2 text-xs font-bold text-cyan-950">
            <div>Selected: #{selected.id} · {getLayerStyle(layerDefs, selected.layer).short}</div>
            <div>Model: {selectedSpec.model}</div>
            <div>Listener distance: {metrics.dist.toFixed(2)} m</div>
            <div>Off-axis angle: {metrics.offAxisDeg.toFixed(1)}°</div>
            <div>Coverage width at listener: {metrics.coverageWidth.toFixed(2)} m</div>
            <div>Coverage height at listener: {metrics.coverageHeight.toFixed(2)} m</div>
            <div>Est. SPL at listener: {metrics.estimatedSpl.toFixed(1)} dB</div>
            <div className={`rounded-lg px-2 py-1 ${metrics.inCoverage ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
              {metrics.inCoverage ? "Listener inside estimated coverage" : "Listener outside estimated coverage"}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs font-semibold text-cyan-900">Select a speaker to inspect coverage.</div>
        )}
      </div>
    </div>
  );
}

function LayoutOptionsPanel({
  showIcosa,
  setShowIcosa,
  showDBAP,
  setShowDBAP,
  showRoomModes,
  setShowRoomModes,
  showCoverage,
  setShowCoverage,
  coverageScope,
  setCoverageScope,
  coverageFilters,
  setCoverageFilters,
  speakerSpecs,
  setSpeakerSpecs,
  layerDefs,
  selectedRoomMode,
  setSelectedRoomMode,
  soundObject,
  setSoundObject,
  dbapStartObject,
  setDbapStartObject,
  listener,
  listenerYaw,
  selected,
  speakerData,
  activeLayers,
  focusMap,
  helpActive,
}) {
  const [tab, setTab] = useState("options");
  const [dbapSubTab, setDbapSubTab] = useState("soundObject");
  const [translationFreq, setTranslationFreq] = useState(1000);
  const [targetTranslation, setTargetTranslation] = useState(70);
  const [calibrationMode, setCalibrationMode] = useState("auto");
  const [maxAngleDeg, setMaxAngleDeg] = useState(180);
  const [sensitivity, setSensitivity] = useState(1);
  const [binauralMix, setBinauralMix] = useState(0.5);
  const [useBinaural, setUseBinaural] = useState(true);
  const [lastCalibration, setLastCalibration] = useState(null);
  const [sceneComplexity, setSceneComplexity] = useState(0);
  const [sceneReverb, setSceneReverb] = useState(false);
  const [adaptationState, setAdaptationState] = useState(0);
  const [hearingProfileMod, setHearingProfileMod] = useState(1);
  const [motionDuration, setMotionDuration] = useState(1);

  const visibleCount = speakerData.filter((s) => activeLayers[s.layer] !== false && speakerMatchesFocusMap(s, focusMap)).length;

  const translation = useMemo(
    () => translationPercentageOptimized({
      startPos: dbapStartObject,
      endPos: soundObject,
      listenerPos: listener,
      listenerYawDeg: listenerYaw,
      freqHz: translationFreq,
      maxAngleDeg,
      sensitivity,
      binauralMix,
      useBinaural,
    }),
    [dbapStartObject, soundObject, listener, listenerYaw, translationFreq, maxAngleDeg, sensitivity, binauralMix, useBinaural],
  );

  const perceptualDiagnostic = useMemo(
    () => computePerceptualRelevance({
      startPos: dbapStartObject,
      endPos: soundObject,
      listenerPos: listener,
      listenerYawDeg: listenerYaw,
      freqHz: translationFreq,
      sceneData: { complexity: sceneComplexity, reverberation: sceneReverb },
      listenerData: { adaptationState, hearingProfileModulator: hearingProfileMod },
      signalData: { durationSec: motionDuration },
    }),
    [dbapStartObject, soundObject, listener, listenerYaw, translationFreq, sceneComplexity, sceneReverb, adaptationState, hearingProfileMod, motionDuration],
  );

  const autoCalibrateTranslation = () => {
    const cal = calibrateTranslationParameters({
      startPos: dbapStartObject,
      endPos: soundObject,
      listenerPos: listener,
      targetPercent: targetTranslation,
      listenerYawDeg: listenerYaw,
      freqHz: translationFreq,
      adjust: calibrationMode,
    });
    setMaxAngleDeg(Number(cal.maxAngleDeg.toFixed(2)));
    setSensitivity(Number(cal.sensitivity.toFixed(3)));
    setBinauralMix(Number(cal.binauralMix.toFixed(3)));
    setUseBinaural(cal.useBinaural);
    setLastCalibration(cal);
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-black text-slate-900">3D Layout Geometry Options</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["options", "Options"],
              ["coverage", "Coverage"],
              ["dbap", "DBAP"],
              ["roomModes", "Room Modes"],
              ["json", "JSON"],
              ["formulas", "Formulas"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-black ${tab === key ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "options" && (
          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => setShowIcosa((v) => !v)}
              className={`rounded-xl border p-3 text-left text-sm font-black ${showIcosa ? "border-[#001f5b] bg-[#001f5b] text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}
            >
              Icosahedral Symmetry
            </button>
            <button className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-black text-slate-900">
              Scope: {visibleCount}
              <HelpTip id="scope" active={helpActive} />
            </button>
          </div>
        )}

        {tab === "coverage" && (
          <CoveragePanel
            showCoverage={showCoverage}
            setShowCoverage={setShowCoverage}
            coverageScope={coverageScope}
            setCoverageScope={setCoverageScope}
            coverageFilters={coverageFilters}
            setCoverageFilters={setCoverageFilters}
            speakerSpecs={speakerSpecs}
            setSpeakerSpecs={setSpeakerSpecs}
            layerDefs={layerDefs}
            selected={selected}
            listener={listener}
            helpActive={helpActive}
          />
        )}

        {tab === "dbap" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDbapSubTab("soundObject")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-black ${dbapSubTab === "soundObject" ? "border-purple-600 bg-purple-50 text-purple-950" : "border-slate-200 bg-slate-50 text-slate-600"}`}
              >
                Sound Object
              </button>
              <button
                onClick={() => setDbapSubTab("relevance")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-black ${dbapSubTab === "relevance" ? "border-purple-600 bg-purple-50 text-purple-950" : "border-slate-200 bg-slate-50 text-slate-600"}`}
              >
                Relevance
              </button>
            </div>

            {dbapSubTab === "soundObject" && (
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <button
                  onClick={() => setShowDBAP((v) => !v)}
                  className={`rounded-xl border p-3 text-left text-sm font-black ${showDBAP ? "border-purple-600 bg-purple-50 text-purple-950" : "border-slate-200 bg-slate-50 text-slate-900"}`}
                >
                  Sound Object
                  <HelpTip id="dbapObject" active={helpActive} />
                </button>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    <label className="text-[10px] font-bold text-slate-600">
                      X<HelpTip id="objectX" active={helpActive} />
                      <input type="number" step="0.05" min={ROOM.xMin} max={ROOM.xMax} value={soundObject.x} onChange={(e) => setSoundObject((o) => ({ ...o, x: clamp(Number(e.target.value || 0), ROOM.xMin, ROOM.xMax) }))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-black text-slate-950" />
                    </label>
                    <label className="text-[10px] font-bold text-slate-600">
                      Y<HelpTip id="objectY" active={helpActive} />
                      <input type="number" step="0.05" min={ROOM.yMin} max={ROOM.yMax} value={soundObject.y} onChange={(e) => setSoundObject((o) => ({ ...o, y: clamp(Number(e.target.value || 0), ROOM.yMin, ROOM.yMax) }))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-black text-slate-950" />
                    </label>
                    <label className="text-[10px] font-bold text-slate-600">
                      Z<HelpTip id="objectZ" active={helpActive} />
                      <input type="number" step="0.05" min={ROOM.zMin} max={ROOM.zMax} value={soundObject.z} onChange={(e) => setSoundObject((o) => ({ ...o, z: clamp(Number(e.target.value || 0), ROOM.zMin, ROOM.zMax) }))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-black text-slate-950" />
                    </label>
                  </div>
                  <label className="block text-[10px] font-bold text-slate-600">
                    Object X
                    <input type="range" min={ROOM.xMin} max={ROOM.xMax} step="0.05" value={soundObject.x} onChange={(e) => setSoundObject((o) => ({ ...o, x: Number(e.target.value) }))} className="w-full accent-purple-600" />
                  </label>
                  <label className="mt-1 block text-[10px] font-bold text-slate-600">
                    Object Y
                    <input type="range" min={ROOM.yMin} max={ROOM.yMax} step="0.05" value={soundObject.y} onChange={(e) => setSoundObject((o) => ({ ...o, y: Number(e.target.value) }))} className="w-full accent-purple-600" />
                  </label>
                  <label className="mt-1 block text-[10px] font-bold text-slate-600">
                    Object Z
                    <input type="range" min={ROOM.zMin} max={ROOM.zMax} step="0.05" value={soundObject.z} onChange={(e) => setSoundObject((o) => ({ ...o, z: Number(e.target.value) }))} className="w-full accent-purple-600" />
                  </label>
                </div>
              </div>
            )}

            {dbapSubTab === "relevance" && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                  <div className="text-xs font-black text-purple-950">Translation for listener</div>
                  <div className="mt-1 text-3xl font-black text-purple-950">{translation.percent.toFixed(1)}%</div>
                  <div className="mt-1 text-[11px] font-semibold text-purple-900">
                    Angular {translation.angularDistDeg.toFixed(1)}° · raw {translation.angularPercent.toFixed(1)}% · {translation.mode}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-bold text-slate-600">
                      Frequency Hz<HelpTip id="frequency" active={helpActive} />
                      <input type="number" min="20" step="10" value={translationFreq} onChange={(e) => setTranslationFreq(Number(e.target.value || 1000))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-black text-slate-950" />
                    </label>
                    <label className="text-[10px] font-bold text-slate-600">
                      Target %<HelpTip id="targetPercent" active={helpActive} />
                      <input type="number" min="1" max="100" step="1" value={targetTranslation} onChange={(e) => setTargetTranslation(clamp(Number(e.target.value || 70), 1, 100))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-black text-slate-950" />
                    </label>
                  </div>
                  <label className="mt-2 block text-[10px] font-bold text-slate-600">
                    Calibrate by<HelpTip id="calibrateBy" active={helpActive} />
                    <select value={calibrationMode} onChange={(e) => setCalibrationMode(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs font-black text-slate-950">
                      <option value="auto">Auto</option>
                      <option value="max_angle_deg">Max angle</option>
                      <option value="sensitivity">Sensitivity</option>
                      <option value="binaural_mix">Binaural mix</option>
                    </select>
                  </label>
                  <button onClick={autoCalibrateTranslation} className="mt-2 w-full rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-black text-purple-950">
                    Auto calibrate to target<HelpTip id="autoCalibrate" active={helpActive} />
                  </button>
                  <button onClick={() => setDbapStartObject({ ...soundObject })} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-950">
                    Set start from current object<HelpTip id="setStart" active={helpActive} />
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-bold text-slate-700">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <label>
                      Max angle<HelpTip id="maxAngle" active={helpActive} />
                      <input type="number" min="10" max="360" step="1" value={maxAngleDeg} onChange={(e) => setMaxAngleDeg(clamp(Number(e.target.value || 180), 10, 360))} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1" />
                    </label>
                    <label>
                      Sensitivity<HelpTip id="sensitivity" active={helpActive} />
                      <input type="number" min="0.1" max="10" step="0.1" value={sensitivity} onChange={(e) => setSensitivity(clamp(Number(e.target.value || 1), 0.1, 10))} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1" />
                    </label>
                  </div>
                  <label className="block">
                    Binaural mix: {binauralMix.toFixed(2)}<HelpTip id="binauralMix" active={helpActive} />
                    <input type="range" min="0" max="1" step="0.05" value={binauralMix} onChange={(e) => setBinauralMix(Number(e.target.value))} className="w-full accent-purple-600" />
                  </label>
                  <label className="mt-2 flex items-center gap-2">
                    <input type="checkbox" checked={useBinaural} onChange={(e) => setUseBinaural(e.target.checked)} />
                    Use binaural weighting<HelpTip id="useBinaural" active={helpActive} />
                  </label>
                  <div className="mt-2">
                    ITD {translation.itdNorm.toFixed(2)} · ILD {translation.ildNorm.toFixed(2)} · Binaural {translation.binauralWeight.toFixed(2)}
                  </div>
                  {lastCalibration && (
                    <div className="mt-2 rounded bg-white p-2">
                      Last: {lastCalibration.chosen} → {lastCalibration.resultingPercent.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 md:col-span-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-black text-emerald-950">Perceptual Diagnostic</div>
                    <div className="text-2xl font-black text-emerald-950">{perceptualDiagnostic.finalPercent.toFixed(1)}%</div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <label className="text-[10px] font-bold text-emerald-950">
                      Scene complexity
                      <input type="range" min="0" max="1" step="0.05" value={sceneComplexity} onChange={(e) => setSceneComplexity(Number(e.target.value))} className="w-full accent-emerald-600" />
                    </label>
                    <label className="text-[10px] font-bold text-emerald-950">
                      Adaptation
                      <input type="range" min="0" max="1" step="0.05" value={adaptationState} onChange={(e) => setAdaptationState(Number(e.target.value))} className="w-full accent-emerald-600" />
                    </label>
                    <label className="text-[10px] font-bold text-emerald-950">
                      Hearing profile
                      <input type="range" min="0.2" max="1.5" step="0.05" value={hearingProfileMod} onChange={(e) => setHearingProfileMod(Number(e.target.value))} className="w-full accent-emerald-600" />
                    </label>
                    <label className="text-[10px] font-bold text-emerald-950">
                      Duration sec
                      <input type="number" min="0.1" step="0.1" value={motionDuration} onChange={(e) => setMotionDuration(Math.max(0.1, Number(e.target.value || 1)))} className="mt-1 w-full rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-black text-emerald-950" />
                    </label>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[11px] font-black text-emerald-950">
                    <input type="checkbox" checked={sceneReverb} onChange={(e) => setSceneReverb(e.target.checked)} />
                    Reverberation / complex field penalty
                  </label>
                  <div className="mt-2 grid gap-2 text-[11px] font-bold text-emerald-950 md:grid-cols-4">
                    <div>Angular cue {perceptualDiagnostic.cues.angularCue.toFixed(2)}</div>
                    <div>Radial cue {perceptualDiagnostic.cues.radialCue.toFixed(2)}</div>
                    <div>ITD cue {perceptualDiagnostic.itdChange.toFixed(2)}</div>
                    <div>ILD cue {perceptualDiagnostic.ildChange.toFixed(2)}</div>
                    <div>Scene ×{perceptualDiagnostic.modulators.sceneModulator.toFixed(2)}</div>
                    <div>History ×{perceptualDiagnostic.modulators.historyModulator.toFixed(2)}</div>
                    <div>Looming ×{perceptualDiagnostic.modulators.loomingBias.toFixed(2)}</div>
                    <div>Hearing ×{perceptualDiagnostic.modulators.hearingProfileModulator.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "roomModes" && (
          <RoomModesPanel
            showRoomModes={showRoomModes}
            setShowRoomModes={setShowRoomModes}
            selectedRoomMode={selectedRoomMode}
            setSelectedRoomMode={setSelectedRoomMode}
            helpActive={helpActive}
          />
        )}

        {tab !== "options" && tab !== "coverage" && tab !== "dbap" && tab !== "roomModes" && <div className="h-3" />}
      </CardContent>
    </Card>
  );
}

function PlanView({ speakerData, layerDefs, activeLayers, selected, setSelected, focusMap, listener, setListener }) {
  const width = 430, height = 390, pad = 54;
  const sx = (x) => pad + ((x - ROOM.xMin) / (ROOM.xMax - ROOM.xMin)) * (width - pad * 2);
  const sy = (y) => pad + ((ROOM.yMax - y) / (ROOM.yMax - ROOM.yMin)) * (height - pad * 2);
  const visible = speakerData.filter((s) => activeLayers[s.layer] !== false);
  const moveListenerFromPointer = (event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const py = ((event.clientY - rect.top) / rect.height) * height;
    const nextX = clamp(ROOM.xMin + ((px - pad) / (width - pad * 2)) * (ROOM.xMax - ROOM.xMin), ROOM.xMin, ROOM.xMax);
    const nextY = clamp(ROOM.yMax - ((py - pad) / (height - pad * 2)) * (ROOM.yMax - ROOM.yMin), ROOM.yMin, ROOM.yMax);
    setListener((l) => ({ ...l, x: Number(nextX.toFixed(2)), y: Number(nextY.toFixed(2)) }));
  };
  return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-4"><div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900"><Crosshair className="h-4 w-4 text-sky-600" /> Top Plan View / true X-Y scale</div><svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border border-slate-200 bg-slate-50" onPointerDown={moveListenerFromPointer} onPointerMove={(e) => { if (e.buttons === 1) moveListenerFromPointer(e); }}><rect x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} fill="#fff" stroke="#0f172a" strokeWidth="1.8" />{[-6.7,-3.35,0,3.35,6.7].map((x) => <text key={x} x={sx(x)} y={height - pad + 28} textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="950">{x.toFixed(x === 0 ? 0 : 2)}</text>)}{[-10.75,-5.38,0,5.38,10.75].map((y) => <text key={y} x={pad - 12} y={sy(y) + 5} textAnchor="end" fill="#0f172a" fontSize="14" fontWeight="950">{y.toFixed(y === 0 ? 0 : 2)}</text>)}<text x={width/2} y="24" textAnchor="middle" fontSize="15" fontWeight="950">Front: Y +10.75 m</text><text x={width/2} y={height - 14} textAnchor="middle" fontSize="15" fontWeight="950">Back: Y -10.75 m</text>{visible.map((s) => { const layer = getLayerStyle(layerDefs, s.layer); const dim = hasAnyLayerSideFocus(focusMap) && !speakerMatchesFocusMap(s, focusMap); return <g key={s.id} onClick={(e) => { e.stopPropagation(); setSelected(s); }} opacity={dim ? 0.18 : 1} className="cursor-pointer"><circle cx={sx(s.x)} cy={sy(s.y)} r={selected?.id === s.id ? 11 : 9} fill={layer.color} stroke="#fff" strokeWidth="1.5" /><text x={sx(s.x)} y={sy(s.y)+3.2} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900">{s.id}</text></g>; })}<g className="cursor-move"><circle cx={sx(listener.x)} cy={sy(listener.y)} r="12" fill="#ffffff" stroke="#0f172a" strokeWidth="2.4" /><circle cx={sx(listener.x)} cy={sy(listener.y) - 3} r="5" fill="#0f172a" /><text x={sx(listener.x)} y={sy(listener.y) + 25} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="950">Listener</text></g></svg></CardContent></Card>;
}

function ElevationView({ speakerData, layerDefs, activeLayers, selected, setSelected, focusMap, mode = "front" }) {
  const width = 430, height = 370, padL = 58, padR = 28, padT = 34, padB = 54;
  const axisMin = mode === "front" ? ROOM.xMin : ROOM.yMin, axisMax = mode === "front" ? ROOM.xMax : ROOM.yMax;
  const sx = (v) => padL + ((v - axisMin) / (axisMax - axisMin)) * (width - padL - padR), sz = (z) => padT + ((ROOM.zMax - z) / (ROOM.zMax - ROOM.zMin)) * (height - padT - padB);
  const candidates = speakerData.filter((s) => activeLayers[s.layer] !== false).filter((s) => mode === "front" ? s.y === ROOM.yMax || s.layer === "ceiling" : s.x === ROOM.xMax || s.layer === "ceiling");
  return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-4"><div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900"><Ruler className="h-4 w-4 text-sky-600" /> {mode === "front" ? "Front Elevation / X-Z" : "Right Elevation / Y-Z"}</div><svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border border-slate-200 bg-slate-50">{[0,2.5,4,5.5,7.2].map((z) => <g key={z}><line x1={padL} y1={sz(z)} x2={width-padR} y2={sz(z)} stroke="#94a3b8" strokeDasharray="6 5" /><text x="12" y={sz(z)+5} fontSize="14" fontWeight="950">{z}m</text></g>)}<line x1={padL} y1={padT} x2={padL} y2={height-padB} stroke="#0f172a" strokeWidth="1.8" /><line x1={padL} y1={height-padB} x2={width-padR} y2={height-padB} stroke="#0f172a" strokeWidth="1.8" />{candidates.map((s) => { const layer = getLayerStyle(layerDefs, s.layer), axis = mode === "front" ? s.x : s.y; const dim = hasAnyLayerSideFocus(focusMap) && !speakerMatchesFocusMap(s, focusMap); return <g key={s.id} onClick={() => setSelected(s)} opacity={dim ? 0.18 : 1} className="cursor-pointer"><rect x={sx(axis)-9} y={sz(s.z)-9} width="18" height="18" rx="3" fill={layer.color} stroke="#fff" strokeWidth="1.5" /><text x={sx(axis)} y={sz(s.z)+3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900">{s.id}</text></g>; })}</svg></CardContent></Card>;
}

function SpeakerDetails({ selected, layerDefs }) {
  const s = selected || DEFAULT_SPEAKERS[0], layer = getLayerStyle(layerDefs, s.layer);
  const rows = [["X", `${s.x.toFixed(2)} m`], ["Y", `${s.y.toFixed(2)} m`], ["Z", `${s.z.toFixed(2)} m`], ["Azimuth", `${s.az.toFixed(1)}°`], ["Tilt", `${s.tilt.toFixed(1)}°`], ["Aim distance", `${distance3D(s, CENTER).toFixed(2)} m`]];
  return <Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-3"><div className="mb-2 flex items-center justify-between"><div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Selected speaker</div><div className="mt-1 flex items-center gap-2 text-lg font-black"><span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs text-white" style={{ background: layer.color }}>#{s.id}</span>{layer.short}</div></div><span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold">{s.wall}</span></div><div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">{rows.map(([l,v]) => <div key={l} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-b-0"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{l}</span><span className="text-xs font-black">{v}</span></div>)}</div></CardContent></Card>;
}

function SelectedSpeakerSideElevation({ selected, speakerData, layerDefs }) {
  const s = selected || speakerData[0], axisMode = s.wall === "Left" || s.wall === "Right" ? "Y-Z" : "X-Z";
  const width = 250, height = 240, padL = 46, padR = 18, padT = 24, padB = 42;
  const min = axisMode === "Y-Z" ? ROOM.yMin : ROOM.xMin, max = axisMode === "Y-Z" ? ROOM.yMax : ROOM.xMax;
  const axis = (sp) => axisMode === "Y-Z" ? sp.y : sp.x, sx = (v) => padL + ((v - min) / (max - min)) * (width - padL - padR), sz = (z) => padT + ((ROOM.zMax - z) / ROOM.zMax) * (height - padT - padB);
  const neighbors = speakerData.filter((sp) => sp.id === s.id || (s.wall !== "Ceiling" && sp.wall === s.wall && Math.abs(axis(sp) - axis(s)) <= 5.5) || (s.wall === "Ceiling" && sp.layer === s.layer && Math.abs(sp.x - s.x) <= 4.5 && Math.abs(sp.y - s.y) <= 6.5));
  return <Card className="mt-3 rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-3"><div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Selected side elevation</div><svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-lg border border-slate-200 bg-slate-50">{[0,2.5,4,5.5,7.2].map((z) => <g key={z}><line x1={padL} y1={sz(z)} x2={width-padR} y2={sz(z)} stroke="#94a3b8" strokeDasharray="5 4" /><text x="9" y={sz(z)+4} fontSize="12" fontWeight="950">{z}</text></g>)}{neighbors.map((sp) => { const layer = getLayerStyle(layerDefs, sp.layer), sel = sp.id === s.id; return <g key={sp.id}><circle cx={sx(axis(sp))} cy={sz(sp.z)} r={sel ? 6 : 4} fill={layer.color} stroke={sel ? "#0f172a" : "#fff"} strokeWidth={sel ? 2 : 1} />{sel && <text x={sx(axis(sp))} y={sz(sp.z)-9} textAnchor="middle" fontSize="8" fontWeight="900">#{sp.id}</text>}</g>; })}</svg></CardContent></Card>;
}

function ListenerCoordinatesPanel({ listener, setListener, listenerYaw, setListenerYaw, showDBAP, speakerData, activeLayers, focusMap, helpActive }) {
  const candidates = useMemo(() => speakerData.filter((s) => activeLayers[s.layer] !== false && speakerMatchesFocusMap(s, focusMap)), [speakerData, activeLayers, focusMap]);
  const minPair = useMemo(() => findMinimumSeparation(listener, candidates), [listener, candidates]);
  return (
    <Card className="mt-3 rounded-xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Listener Coordinates</div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-600">X<HelpTip id="listenerX" active={helpActive} />
              <input type="number" step="0.05" value={listener.x} onChange={(e) => setListener((l) => ({ ...l, x: clamp(Number(e.target.value || 0), ROOM.xMin, ROOM.xMax) }))} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-950" />
            </label>
            <label className="text-[10px] font-bold text-slate-600">Y<HelpTip id="listenerY" active={helpActive} />
              <input type="number" step="0.05" value={listener.y} onChange={(e) => setListener((l) => ({ ...l, y: clamp(Number(e.target.value || 0), ROOM.yMin, ROOM.yMax) }))} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-950" />
            </label>
            <label className="text-[10px] font-bold text-slate-600">Z<HelpTip id="listenerZ" active={helpActive} />
              <input type="number" step="0.01" value={listener.z.toFixed(2)} disabled className="mt-1 w-full rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-black text-slate-500" />
            </label>
            <label className="text-[10px] font-bold text-slate-600">Azimuth<HelpTip id="listenerAzimuth" active={helpActive} />
              <input type="number" step="1" value={listenerYaw} onChange={(e) => setListenerYaw(Number(e.target.value || 0))} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-950" />
            </label>
          </div>
          <label className="block text-[10px] font-bold text-slate-600">Listener X
            <input type="range" min={ROOM.xMin} max={ROOM.xMax} step="0.05" value={listener.x} onChange={(e) => setListener((l) => ({ ...l, x: Number(e.target.value) }))} className="w-full accent-sky-600" />
          </label>
          <label className="mt-1 block text-[10px] font-bold text-slate-600">Listener Y
            <input type="range" min={ROOM.yMin} max={ROOM.yMax} step="0.05" value={listener.y} onChange={(e) => setListener((l) => ({ ...l, y: Number(e.target.value) }))} className="w-full accent-sky-600" />
          </label>
          <label className="mt-1 block text-[10px] font-bold text-slate-600">Listener azimuth
            <input type="range" min="-180" max="180" step="1" value={listenerYaw} onChange={(e) => setListenerYaw(Number(e.target.value))} className="w-full accent-sky-600" />
          </label>
        </div>
        {showDBAP && (
          <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-2 text-xs">
            <div className="font-black text-purple-950">Minimum DBAP separation</div>
            {minPair ? (
              <div className="mt-1 text-purple-950">
                <b>{minPair.angle.toFixed(2)}°</b> between speaker <b>#{minPair.a.id}</b> and <b>#{minPair.b.id}</b>
              </div>
            ) : <div className="mt-1 text-slate-500">Need at least two visible speakers.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JsonImportPanel({ speakerData, setSpeakerData, layerDefs, setLayerDefs, setActiveLayers, setSelected, setFocusMap }) {
  const template = useMemo(() => JSON.stringify({ room: { ...ROOM, units: "meters" }, aimReference: CENTER, layers: layerDefs, speakers: speakerData.map(({ id, layer, wall, x, y, z, az, tilt }) => ({ id, layer, wall, x, y, z, azimuthDeg: az, tiltDeg: tilt })) }, null, 2), [speakerData, layerDefs]);
  const [open, setOpen] = useState(false), [jsonText, setJsonText] = useState(template), [status, setStatus] = useState("Paste JSON, upload a JSON file, or download the template first.");
  const normalizeImported = (parsed) => {
    const imported = Array.isArray(parsed?.speakers) ? parsed.speakers : [];
    if (!imported.length) throw new Error("JSON must contain a speakers array.");
    const newSpeakers = imported.map((s, i) => ({ id: Number(s.id ?? i + 1), layer: String(s.layer ?? "custom"), wall: String(s.wall ?? "Custom"), x: Number(s.x ?? 0), y: Number(s.y ?? 0), z: Number(s.z ?? 0), az: Number(s.azimuthDeg ?? s.az ?? 0), tilt: Number(s.tiltDeg ?? s.tilt ?? 0) }));
    const palette = ["#2f9bff", "#ff8a1c", "#7bc950", "#a855f7", "#ef4444", "#14b8a6"];
    const newLayers = {};
    [...new Set(newSpeakers.map((s) => s.layer))].forEach((key, idx) => { const l = parsed.layers?.[key] || {}; newLayers[key] = { name: l.name || key, short: l.short || key, z: Number(l.z ?? newSpeakers.find((s) => s.layer === key)?.z ?? 0), color: l.color || palette[idx % palette.length] }; });
    return { newSpeakers, newLayers };
  };
  const importJson = () => { try { const { newSpeakers, newLayers } = normalizeImported(JSON.parse(jsonText)); setSpeakerData(newSpeakers); setLayerDefs(newLayers); setActiveLayers(Object.fromEntries(Object.keys(newLayers).map((k) => [k, true]))); setFocusMap({}); setSelected(newSpeakers[0]); setStatus(`Imported ${newSpeakers.length} speakers and ${Object.keys(newLayers).length} layers.`); } catch (e) { setStatus(`Import failed: ${e.message}`); } };
  const downloadTemplate = () => { const blob = new Blob([template], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "speaker-layout-import-template.json"; a.click(); URL.revokeObjectURL(url); };
  const uploadJson = async (e) => { const file = e.target.files?.[0]; if (!file) return; setJsonText(await file.text()); setOpen(true); setStatus(`Loaded ${file.name}. Click Import JSON to apply it.`); };
  return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-3"><div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"><div><div className="text-sm font-black">JSON Speaker Position Import</div><div className="text-xs text-slate-600">Import coordinates and layer definitions.</div></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>{open ? "Hide JSON" : "Show JSON"}</Button><Button variant="outline" size="sm" onClick={downloadTemplate}>Download Template</Button><label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Upload JSON<input type="file" accept="application/json,.json" className="hidden" onChange={uploadJson} /></label><Button variant="outline" size="sm" onClick={importJson}>Import JSON</Button></div></div><div className="mt-2 text-xs font-semibold text-slate-600">{status}</div>{open && <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="mt-3 h-60 w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-slate-50 outline-none" />}</CardContent></Card>;
}

function exportSpeakerCoordinatesPDF(speakerData, layerDefs) {
  try {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginX = 10;
    const footerY = pageHeight - 7;
    const generatedAt = new Date().toLocaleString();

    const drawFooter = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("For revisions: arya.uniyal@gmail.com", marginX, footerY);
      doc.setFont("helvetica", "bold");
      doc.text("AudioToys", pageWidth - 27, footerY);
      doc.setTextColor(15, 23, 42);
    };

    const drawTitle = (title, subtitle) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(title, marginX, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.text(subtitle, marginX, 18);
      doc.text(`Generated: ${generatedAt}`, marginX, 23);
      drawFooter();
    };

    const drawManualTable = ({ title, subtitle, columns, rows }) => {
      drawTitle(title, subtitle);
      let y = 31;
      const rowH = 5.2;
      const headerH = 6;
      const bottomLimit = pageHeight - 14;

      const drawHeader = () => {
        doc.setFillColor(226, 232, 240);
        doc.rect(marginX, y - 4.4, pageWidth - marginX * 2, headerH, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(15, 23, 42);
        columns.forEach((col) => doc.text(col.label, col.x, y));
        y += headerH;
      };

      drawHeader();
      rows.forEach((row, index) => {
        if (y > bottomLimit) {
          doc.addPage("a4", "landscape");
          y = 31;
          drawTitle(title, subtitle);
          drawHeader();
        }

        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, y - 4.1, pageWidth - marginX * 2, rowH, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.1);
        doc.setTextColor(15, 23, 42);
        columns.forEach((col, colIndex) => {
          const raw = row[colIndex] ?? "";
          const text = String(raw).slice(0, col.maxChars || 24);
          doc.text(text, col.x, y);
        });
        y += rowH;
      });
    };

    const coordinateColumns = [
      { label: "#", x: 10, maxChars: 4 },
      { label: "Layer", x: 21, maxChars: 14 },
      { label: "Wall", x: 48, maxChars: 12 },
      { label: "X", x: 72, maxChars: 8 },
      { label: "Y", x: 92, maxChars: 8 },
      { label: "Z", x: 112, maxChars: 8 },
      { label: "Az", x: 132, maxChars: 8 },
      { label: "Tilt", x: 154, maxChars: 8 },
    ];

    const coordinateRows = speakerData.map((s) => {
      const layer = getLayerStyle(layerDefs, s.layer);
      return [
        s.id,
        layer.short || s.layer,
        s.wall,
        s.x.toFixed(2),
        s.y.toFixed(2),
        s.z.toFixed(2),
        Number(s.az).toFixed(1),
        Number(s.tilt).toFixed(1),
      ];
    });

    drawManualTable({
      title: "AudioToys Speaker Coordinates Export",
      subtitle: `Room: X = +/-6.7 m, Y = +/-10.75 m, Z = 0-7.2 m | Units: meters | Total speakers: ${speakerData.length}`,
      columns: coordinateColumns,
      rows: coordinateRows,
    });

    doc.addPage("a4", "landscape");

    const cornerColumns = [
      { label: "#", x: 10, maxChars: 4 },
      { label: "Layer", x: 21, maxChars: 14 },
      { label: "Wall", x: 48, maxChars: 12 },
      { label: "Ref corner", x: 72, maxChars: 24 },
      { label: "Dist", x: 128, maxChars: 8 },
      { label: "dX", x: 151, maxChars: 8 },
      { label: "dY", x: 172, maxChars: 8 },
      { label: "dZ", x: 193, maxChars: 8 },
    ];

    const cornerRows = speakerData.map((s) => {
      const layer = getLayerStyle(layerDefs, s.layer);
      const ref = nearestReferenceCorner(s);
      const corner = ref.corner;
      return [
        s.id,
        layer.short || s.layer,
        s.wall,
        corner.label.replace("ceiling", "ceil").replace("floor", "flr"),
        ref.distance.toFixed(2),
        (s.x - corner.x).toFixed(2),
        (s.y - corner.y).toFixed(2),
        (s.z - corner.z).toFixed(2),
      ];
    });

    drawManualTable({
      title: "Corner Distance Reference",
      subtitle: "Wall speakers use nearest corner on their own wall. Ceiling speakers use nearest ceiling corner.",
      columns: cornerColumns,
      rows: cornerRows,
    });

    const filename = "audiotoys-speaker-coordinates.pdf";
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    // Try automatic download first. Some embedded previews block this,
    // so CoordinatesTabs also exposes the returned URL as a manual link.
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { ok: true, url, filename };
  } catch (error) {
    console.error("PDF export failed:", error);
    return { ok: false, error: error?.message || "PDF export failed" };
  }
}

function nearestReferenceCorner(s) {
  const candidates = (s.wall === "Ceiling" || s.layer === "ceiling") ? CORNERS.filter((c) => c.z === ROOM.zMax) : s.wall === "Left" ? CORNERS.filter((c) => c.x === ROOM.xMin) : s.wall === "Right" ? CORNERS.filter((c) => c.x === ROOM.xMax) : s.wall === "Front" ? CORNERS.filter((c) => c.y === ROOM.yMax) : s.wall === "Back" ? CORNERS.filter((c) => c.y === ROOM.yMin) : CORNERS;
  return candidates.reduce((best, c) => { const d = distance3D(s, c); return !best || d < best.distance ? { corner: c, distance: d } : best; }, null);
}
function CoordinatesTabs({ speakerData, layerDefs }) {
  const [tab, setTab] = useState("coordinates");
  const [exportResult, setExportResult] = useState(null);

  useEffect(() => {
    return () => {
      if (exportResult?.url) URL.revokeObjectURL(exportResult.url);
    };
  }, [exportResult]);

  const handleExportPDF = () => {
    if (exportResult?.url) URL.revokeObjectURL(exportResult.url);
    const result = exportSpeakerCoordinatesPDF(speakerData, layerDefs);
    setExportResult(result);
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black">All Speaker Coordinates + Corner Distance</div>
            {exportResult?.ok && (
              <a
                href={exportResult.url}
                download={exportResult.filename}
                className="mt-1 inline-block rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-100"
              >
                Download generated PDF
              </a>
            )}
            {exportResult && !exportResult.ok && (
              <div className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                Export failed: {exportResult.error}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportPDF} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-800 hover:bg-rose-100">
              Export PDF
            </button>
            <button onClick={() => setTab("coordinates")} className={`rounded-lg border px-3 py-1.5 text-xs font-black ${tab === "coordinates" ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              All Coordinates
            </button>
            <button onClick={() => setTab("distance")} className={`rounded-lg border px-3 py-1.5 text-xs font-black ${tab === "distance" ? "border-sky-500 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              Distance from Room Corner
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Layer</th>
                <th className="px-3 py-2">Wall</th>
                <th className="px-3 py-2">X</th>
                <th className="px-3 py-2">Y</th>
                <th className="px-3 py-2">Z</th>
                {tab === "coordinates" ? (
                  <>
                    <th className="px-3 py-2">Azimuth</th>
                    <th className="px-3 py-2">Tilt</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2">Reference corner</th>
                    <th className="px-3 py-2">Distance</th>
                    <th className="px-3 py-2">ΔX/ΔY/ΔZ</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {speakerData.map((s) => {
                const layer = getLayerStyle(layerDefs, s.layer);
                const ref = nearestReferenceCorner(s);
                const c = ref.corner;
                return (
                  <tr key={s.id} className="border-t border-slate-100 odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 font-black">{s.id}</td>
                    <td className="px-3 py-2"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: layer.color }} />{layer.short || s.layer}</td>
                    <td className="px-3 py-2">{s.wall}</td>
                    <td className="px-3 py-2">{s.x.toFixed(2)}</td>
                    <td className="px-3 py-2">{s.y.toFixed(2)}</td>
                    <td className="px-3 py-2">{s.z.toFixed(2)}</td>
                    {tab === "coordinates" ? (
                      <>
                        <td className="px-3 py-2">{s.az.toFixed(1)}°</td>
                        <td className="px-3 py-2">{s.tilt.toFixed(1)}°</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2">{c.label}</td>
                        <td className="px-3 py-2 font-bold">{ref.distance.toFixed(2)} m</td>
                        <td className="px-3 py-2">{(s.x - c.x).toFixed(2)} / {(s.y - c.y).toFixed(2)} / {(s.z - c.z).toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function App() {
  const [speakerData, setSpeakerData] = useState(DEFAULT_SPEAKERS);
  const [layerDefs, setLayerDefs] = useState(DEFAULT_LAYERS);
  const [activeLayers, setActiveLayers] = useState({ ceiling: true, upper: true, middle: true });
  const [showAim, setShowAim] = useState(true), [showIcosa, setShowIcosa] = useState(false), [showDBAP, setShowDBAP] = useState(false), [showRoomModes, setShowRoomModes] = useState(false), [showCoverage, setShowCoverage] = useState(false);
  const [view, setView] = useState("iso"), [selected, setSelected] = useState(DEFAULT_SPEAKERS[0]), [focusMap, setFocusMap] = useState({}), [projectName, setProjectName] = useState("Shiva Immersive");
  const [helpActive, setHelpActive] = useState(false);
  const [listener, setListener] = useState({ x: 0, y: 0, z: LISTENER_HEIGHT_M });
  const [listenerYaw, setListenerYaw] = useState(0);
  const [soundObject, setSoundObject] = useState({ x: 0, y: 0, z: CENTER.z });
  const [dbapStartObject, setDbapStartObject] = useState({ x: 0, y: 0, z: CENTER.z });
  const [selectedRoomMode, setSelectedRoomMode] = useState({ p: 1, q: 0, r: 0, fCalc: roomModeFrequency({ p: 1, q: 0, r: 0 }), type: "Axial", errorHz: 0 });
  const [speakerSpecs, setSpeakerSpecs] = useState(DEFAULT_SPEAKER_SPECS);
  const [coverageScope, setCoverageScope] = useState("visible");
  const [coverageFilters, setCoverageFilters] = useState({ left: true, right: true, front: true, bottom: true, overheadLeft: true, overheadCenter: true, overheadRight: true });
  const [coveragePreviewLayer, setCoveragePreviewLayer] = useState(null);
  useEffect(() => { runInternalTests(); }, []);
  useEffect(() => {
    // Run the coverage intro on every fresh page load / refresh.
    // It intentionally does NOT use localStorage, because persistent storage can block the intro after one broken/partial run.
    const previous = {
      showCoverage: false,
      coverageScope: "visible",
      coveragePreviewLayer: null,
    };

    const steps = [
      { layer: "middle", at: 150 },
      { layer: "upper", at: 1550 },
      { layer: "ceiling", at: 2950 },
      { layer: "all", at: 4350 },
      { layer: null, off: true, at: 6200 },
    ];

    setCoverageScope("visible");
    setShowCoverage(true);
    setCoveragePreviewLayer("middle");

    const timers = steps.map((step) => window.setTimeout(() => {
      if (step.off) {
        setCoveragePreviewLayer(previous.coveragePreviewLayer);
        setCoverageScope(previous.coverageScope);
        setShowCoverage(previous.showCoverage);
      } else {
        setCoverageScope("visible");
        setShowCoverage(true);
        setCoveragePreviewLayer(step.layer);
      }
    }, step.at));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  const onSideFocus = (layer, side) => { const next = { ...focusMap, [layer]: { ...(focusMap[layer] || {}), [side]: !focusMap?.[layer]?.[side] } }; setFocusMap(next); const match = speakerData.find((s) => activeLayers[s.layer] !== false && speakerMatchesFocusMap(s, next)); if (match) setSelected(match); };
  return <div className="min-h-screen bg-white p-4 text-slate-950 md:p-6"><HelpToggle active={helpActive} setActive={setHelpActive} /><div className="mx-auto max-w-[1900px]"><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4"><div className="text-xs font-bold uppercase tracking-[0.28em] text-sky-600">AudioToys Immersive speaker visualizer</div><input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1 w-full max-w-4xl rounded-xl border border-transparent bg-white px-0 py-1 text-3xl font-black tracking-tight text-slate-950 outline-none hover:border-slate-200 focus:border-sky-400 md:text-5xl" /></motion.div><main className="space-y-4"><div className="grid gap-4 xl:grid-cols-[170px_minmax(760px,1fr)_250px]"><aside className="space-y-3"><Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-2"><div className="mb-2 flex items-center justify-between gap-2 font-black text-slate-900"><span className="flex items-center gap-1 text-xs"><Layers className="h-3.5 w-3.5 text-sky-600" /> Layers</span>{hasAnyLayerSideFocus(focusMap) && <button onClick={() => setFocusMap({})} className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800">ALL</button>}</div><TopControlStrip speakerData={speakerData} layerDefs={layerDefs} activeLayers={activeLayers} setActiveLayers={setActiveLayers} focusMap={focusMap} setFocusMap={setFocusMap} onSideFocus={onSideFocus} /></CardContent></Card><NavigationBar view={view} setView={setView} showAim={showAim} setShowAim={setShowAim} /></aside><div className="space-y-4"><Room3D speakerData={speakerData} layerDefs={layerDefs} activeLayers={activeLayers} showAim={showAim} showIcosa={showIcosa} showDBAP={showDBAP} showRoomModes={showRoomModes} showCoverage={showCoverage} coverageScope={coverageScope} coverageFilters={coverageFilters} coveragePreviewLayer={coveragePreviewLayer} speakerSpecs={speakerSpecs} selectedRoomMode={selectedRoomMode} view={view} selected={selected} setSelected={setSelected} focusMap={focusMap} listener={listener} setListener={setListener} soundObject={soundObject} setSoundObject={setSoundObject} /><LayoutOptionsPanel showIcosa={showIcosa} setShowIcosa={setShowIcosa} showDBAP={showDBAP} setShowDBAP={setShowDBAP} showRoomModes={showRoomModes} setShowRoomModes={setShowRoomModes} showCoverage={showCoverage} setShowCoverage={setShowCoverage} coverageScope={coverageScope} setCoverageScope={setCoverageScope} coverageFilters={coverageFilters} setCoverageFilters={setCoverageFilters} speakerSpecs={speakerSpecs} setSpeakerSpecs={setSpeakerSpecs} layerDefs={layerDefs} selectedRoomMode={selectedRoomMode} setSelectedRoomMode={setSelectedRoomMode} soundObject={soundObject} setSoundObject={setSoundObject} dbapStartObject={dbapStartObject} setDbapStartObject={setDbapStartObject} listener={listener} listenerYaw={listenerYaw} selected={selected} speakerData={speakerData} activeLayers={activeLayers} focusMap={focusMap} helpActive={helpActive} /></div><aside><SpeakerDetails selected={selected} layerDefs={layerDefs} /><SelectedSpeakerSideElevation selected={selected} speakerData={speakerData} layerDefs={layerDefs} /><ListenerCoordinatesPanel listener={listener} setListener={setListener} listenerYaw={listenerYaw} setListenerYaw={setListenerYaw} showDBAP={showDBAP} speakerData={speakerData} activeLayers={activeLayers} focusMap={focusMap} helpActive={helpActive} /></aside></div><div className="grid gap-4 xl:grid-cols-2"><PlanView speakerData={speakerData} layerDefs={layerDefs} activeLayers={activeLayers} selected={selected} setSelected={setSelected} focusMap={focusMap} listener={listener} setListener={setListener} /><ElevationView speakerData={speakerData} layerDefs={layerDefs} activeLayers={activeLayers} selected={selected} setSelected={setSelected} focusMap={focusMap} mode="front" /></div><CoordinatesTabs speakerData={speakerData} layerDefs={layerDefs} /><JsonImportPanel speakerData={speakerData} setSpeakerData={setSpeakerData} layerDefs={layerDefs} setLayerDefs={setLayerDefs} setActiveLayers={setActiveLayers} setSelected={setSelected} setFocusMap={setFocusMap} />
          <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Design methodology notes</div>
              <div className="grid gap-2 text-[10px] leading-snug text-slate-700 md:grid-cols-2 xl:grid-cols-3">
                <p><b>Icosahedral Tiling:</b> icosahedral angles as a target for angular spacing for natural object movement.</p>
                <p><b>Minimum Angle of Separation (DBAP):</b> verified the maximum angular gap is 33° for smooth, jump-free panning.</p>
                <p><b>Elliptical Projection:</b> compensates for the rectangular room shape, ensuring uniform speaker density on all walls.</p>
                <p><b>Acute Triangle Test (VBAP):</b> tests all speaker triples for the stability and accuracy of vertical sound movement in 3D space.</p>
                <p><b>Room Mode Avoidance:</b> calculated the room’s standing waves and adjusted speaker placement to avoid pressure maxima for even bass response.</p>
                <p><b>Constant Power Panning Law:</b> continuously normalizes gain, preventing audible loudness changes as sound moves between speakers.</p>
                <p><b>Fibonacci Lattice:</b> initial conceptual set of uniform directions used before mapping speakers to the physical room.</p>
                <p><b>Boundary Projection:</b> maps ideal spherical speaker directions onto the flat surfaces of the walls and ceiling.</p>
                <p><b>Multi-ring Vertical Layering:</b> designed the speaker rings to match the height of the audience movement zone.</p>
                <p><b>Azimuth Equalisation per Wall:</b> ensured even physical spacing by equalizing the azimuth of speakers along each wall.</p>
                <p><b>Zero-sweet-spot Aiming:</b> all speakers were aimed using Zero Sweet Spot methodology to create a uniform sound field across the listening area.</p>
                <p><b>NAZ Avoidance:</b> avoided the Near-field Acoustic Zone so speakers were not wasted on empty central areas.</p>
                <p><b>Angular Gap Validation:</b> final check confirmed the angular separation meets psychoacoustic requirements for smooth panning.</p>
              </div>
            </CardContent>
          </Card><footer className="relative mt-6 border-t border-slate-200 py-4 text-xs text-slate-600"><div className="text-center font-semibold">For revisions mail address - arya.uniyal@gmail.com</div><div className="absolute right-0 top-4 font-black text-slate-900">AudioToys</div></footer></main></div></div>;
}

export default App;
