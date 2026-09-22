/**
 * Brida Mecanizada con Cara Realzada y 4 Orificios con ROSCA INTERNA
 * Archivo: tor.forge.js
 */

// ==========================================
// 1. PARÁMETROS CONFIGURABLES
// ==========================================
const outerDiameter = Param.number("Diámetro Exterior (mm)", 150.0, { min: 50.0, max: 350.0, step: 5.0, unit: "mm" });
const flangeThickness = Param.number("Espesor del Disco (mm)", 18.0, { min: 8.0, max: 50.0, step: 1.0, unit: "mm" });
const boltHoleCount = Param.number("Cantidad de Orificios", 4, { min: 3, max: 12, integer: true });
const threadNominalDia = Param.number("Diámetro Rosca Métrica (mm)", 18.0, { min: 6.0, max: 35.0, step: 1.0, unit: "mm" });
const threadPitch = Param.number("Paso de Rosca (mm)", 2.0, { min: 1.0, max: 4.0, step: 0.25, unit: "mm" });
const threadDepth = Param.number("Profundidad Filete (mm)", 1.2, { min: 0.4, max: 2.5, step: 0.1, unit: "mm" });
const bcd = Param.number("Diámetro Círculo BCD (mm)", 115.0, { min: 40.0, max: 300.0, step: 2.0, unit: "mm" });
const centerBoreDia = Param.number("Diámetro Paso Central (mm)", 52.0, { min: 20.0, max: 180.0, step: 1.0, unit: "mm" });
const internalStepDia = Param.number("Diámetro Rebaje Interior (mm)", 64.0, { min: 25.0, max: 200.0, step: 1.0, unit: "mm" });
const internalStepDepth = Param.number("Profundidad Rebaje (mm)", 6.0, { min: 0.0, max: 25.0, step: 0.5, unit: "mm" });
const raisedFaceDia = Param.number("Diámetro Cara Realzada (mm)", 86.0, { min: 40.0, max: 220.0, step: 2.0, unit: "mm" });
const raisedFaceHeight = Param.number("Altura Cara Realzada (mm)", 3.5, { min: 0.5, max: 10.0, step: 0.5, unit: "mm" });
const collarStepDia = Param.number("Diámetro Resalto Concéntrico (mm)", 74.0, { min: 30.0, max: 150.0, step: 1.0, unit: "mm" });

// ==========================================
// 2. CONSTRUCCIÓN GEOMÉTRICA DE LA BRIDA
// ==========================================
const rOuter = outerDiameter / 2.0;
const rBcd = bcd / 2.0;
const rBore = centerBoreDia / 2.0;
const rStep = internalStepDia / 2.0;
const rRF = raisedFaceDia / 2.0;
const rCollar = collarStepDia / 2.0;

// Sólido base y cara realzada
let baseBody = cylinder(flangeThickness, rOuter);
const rfBase = cylinder(raisedFaceHeight, rRF).translate(0, 0, flangeThickness);
const rfCollar = cylinder(1.2, rCollar).translate(0, 0, flangeThickness + raisedFaceHeight);

let fullSolid = baseBody.add(rfBase, rfCollar);

// Orificio central y rebaje
const centerBore = cylinder(flangeThickness + raisedFaceHeight + 10, rBore).translate(0, 0, -5);
const stepCutter = cylinder(internalStepDepth + 5, rStep)
  .translate(0, 0, flangeThickness + raisedFaceHeight + 1.2 - internalStepDepth);
const rfGrooveCutter = cylinder(2.0, rRF + 1.5, rRF).subtract(cylinder(2.0, rRF)).translate(0, 0, flangeThickness);

fullSolid = fullSolid.subtract(centerBore, stepCutter, rfGrooveCutter);

// ==========================================
// 3. GENERACIÓN DE LOS 4 ORIFICIOS CON ROSCA INTERNA
// ==========================================
const totalHoleDepth = flangeThickness + 10;
const coreRadius = (threadNominalDia / 2.0) - threadDepth;

function makeThreadedCutter() {
  let cutter;
  try {
    const helical = lib.thread(threadNominalDia, threadPitch, totalHoleDepth, {
      depth: threadDepth,
      segments: 32
    });
    cutter = helical.add(cylinder(totalHoleDepth, coreRadius));
  } catch (e) {
    let rings = cylinder(totalHoleDepth, coreRadius);
    const count = Math.floor(totalHoleDepth / threadPitch);
    for (let r = 0; r < count; r++) {
      const ring = cylinder(threadPitch * 0.6, threadNominalDia / 2.0, coreRadius).translate(0, 0, r * threadPitch);
      rings = rings.add(ring);
    }
    cutter = rings;
  }
  return cutter;
}

const threadCutters = [];
for (let i = 0; i < boltHoleCount; i++) {
  const angleRad = (i * (360 / boltHoleCount) * Math.PI) / 180;
  const bx = rBcd * Math.cos(angleRad);
  const by = rBcd * Math.sin(angleRad);
  threadCutters.push(makeThreadedCutter().translate(bx, by, -5));
}

fullSolid = fullSolid.subtract(...threadCutters);

// ==========================================
// 4. MATERIAL Y RETORNO
// ==========================================
const finalFlange = fullSolid
  .color("#B0B7BD")
  .material({
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.1
  });

verify.notEmpty("La brida tiene geometría sólida válida", finalFlange);

return {
  "Brida 4 Orificios con Rosca Interna": finalFlange,
};
