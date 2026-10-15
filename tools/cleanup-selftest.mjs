import assert from 'node:assert/strict';
import { makeCase, kit, expected, grade, explanation, parentOf } from '../assets/data/cleanup.js';
import { renderEPG } from '../assets/epg/render-svg.js';
import { sizeOf } from '../assets/epg/panels.js';
for (let seed=0; seed<250; seed++) {
  const c=makeCase(seed);
  assert.deepEqual(c, makeCase(seed), 'seed reproducibility');
  assert.equal(c.sim.peaks.filter(p=>p.kind==='allele').length, 6);
  assert.equal(c.candidates.filter(p=>p.offladder).length, 1);
  assert(c.sim.noise);
  assert(c.candidates.every(p=>p.height>=150 && ['keep','review','stutter','pullup'].includes(expected(p))));
  assert.equal(c.candidates.filter(p=>p.kind==='pullup').length,1, 'one detectable echo per trace');
  assert(c.candidates.filter(p=>p.kind!=='allele').length<=4, 'sparse trace: at most four extra calls across three loci');
  for (const l of kit.loci) {
    assert(c.candidates.filter(p=>p.kind==='stutter' && p.locus===l.name).length<=1, 'at most one detected stutter per locus');
    const sizes = c.geno[l.name].map(a=>sizeOf(l,a));
    assert(c.candidates.filter(p=>p.kind!=='allele' && p.dye===l.dye && p.size>=Math.min(...sizes)-l.repeat && p.size<=Math.max(...sizes)+l.repeat).length<=2, 'at most two extra peaks around each marker');
  }
  for (const kind of ['pullup','stutter']) assert(c.candidates.some(p=>p.kind===kind));
  for (const p of c.sim.peaks.filter(p=>p.kind==='pullup')) {
    const q=parentOf(c.sim,p); assert(q); assert.notEqual(q.dye,p.dye); assert.equal(q.size,p.size);
    assert.equal(expected(q),'keep', 'parent allele retained');
  }
  assert(kit.loci.some(l=> {
    const pair=c.candidates.filter(p=>p.kind==='allele' && p.locus===l.name);
    return Math.min(...pair.map(p=>p.height))/Math.max(...pair.map(p=>p.height))<0.5;
  }), 'imbalance guaranteed at a variable locus');
  for (const p of c.candidates) {
    for (const lang of ['fr','en']) assert(explanation(c,p,lang).length>80);
    if(p.kind==='allele') {
      const l=kit.loci.find(l=>l.name===p.locus);
      assert(c.geno[l.name].includes(Number(p.label)));
      assert.equal(Math.abs(p.size-sizeOf(l,Number(p.label))),p.offladder?1:0);
    }
  }
  const perfect=Object.fromEntries(c.candidates.map(p=>[p.id,expected(p)]));
  assert.equal(grade(c,perfect).correct,c.candidates.length);
  assert.equal(grade(c,{}).correct,0);
  const allKeep=Object.fromEntries(c.candidates.map(p=>[p.id,'keep']));
  assert(grade(c,allKeep).correct< c.candidates.length);
  const ol=c.candidates.find(p=>p.offladder); perfect[ol.id]='pullup';
  assert.equal(grade(c,perfect).correct,c.candidates.length-1);
  const svg=renderEPG(kit,c.sim,{neutralArtifacts:true}).svg;
  assert(!svg.includes('opacity="0.4"')); // do not reveal artifact class visually
  assert(renderEPG(kit,c.sim).svg.includes('opacity="0.4"'), 'default renderer preserved');
}
console.log('MG4: 250 seeded cases, ground truth, grading and rendering checks passed.');
