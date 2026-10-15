import assert from 'node:assert/strict';
import { makeCase, extract, analyze, gradeResult, autoLoci, yLoci, policy } from '../assets/data/casework.js';
const seen = { carryover:false, pure:false, unknown:false, known:false, maternal:false };
for (let seed=0;seed<150;seed++) for (const type of ['semen','blood','bone']) {
  const c=makeCase(seed,type);
  assert.deepEqual(c,makeCase(seed,type));
  const refs=c.refs.filter(r=>r.id!=='U');
  assert.equal(refs.length,3);
  assert(c.refs.every(r=>/^M-\d{6}$/.test(r.mt)), 'sequence IDs do not leak reference identity');
  for (const strategy of ['classic','differential']) {
    const extracts=extract(c,strategy);
    if (type!=='semen' && strategy==='differential') { assert.equal(extracts.length,0); continue; }
    assert.equal(extracts.length,type==='semen'&&strategy==='differential' || type==='blood' ? 2 : 1);
    for (const e of extracts) {
      assert(e.y<=e.auto);
      assert(Math.abs(e.auto/e.large-e.di)<0.03,'DI derives from short/long autosomal targets');
      assert(!Object.hasOwn(e,'yDI'),'no invented Y degradation index');
      for (const method of ['auto','y','mt','defer']) {
        const r=analyze(c,e,method);
        assert(!r.matches.includes('U'),'unknown donor never becomes selectable');
        assert.deepEqual(gradeResult(r,r.matches,r.conclusion),{references:true,conclusion:true});
        assert.equal(gradeResult(r,null,'').references,false,'unanswered is not none');
        assert.equal(gradeResult(r,null,'').conclusion,false);
        assert.equal(gradeResult(r,['invalid'],r.conclusion).references,false);
        if(r.status==='noresult') { assert.equal(r.rows.length,0); assert.equal(r.matches.length,0); continue; }
        assert.equal(r.rows.length,method==='auto'?21:method==='y'?yLoci.length:1);
        if(method==='auto' && e.sources.length===1) {
          const donor=c.refs.find(ref=>ref.id===e.sources[0]);
          for (const row of r.rows) assert.deepEqual(row.value,donor.auto[row.locus]);
          assert.deepEqual(r.matches,donor.id==='U'?[]:[donor.id]);
        }
        if(method==='auto' && e.sources.length>1) {
          assert.equal(r.conclusion,'mixture');
          assert(e.sources.some(id=>id==='A'));
          for(const id of e.sources) assert(r.matches.includes(id));
          assert(r.rows.some(row=>row.value.length>2),'mixture visible in clean table');
        }
        if(method==='y' && type==='semen') {
          assert.deepEqual(r.matches,['B','C']); assert.equal(r.conclusion,'lineage');
          assert.equal(gradeResult(r,[c.donor],'single').conclusion,false);
        }
        if(method==='mt' && c.donor==='A') {
          assert.deepEqual(r.matches,['A','B']); assert.equal(r.conclusion,'lineage'); seen.maternal=true;
        }
      }
    }
  }
  if(type==='semen') {
    assert.equal(extract(c,'classic')[0].preferred,'y');
    assert.equal(analyze(c,extract(c,'classic')[0],'auto').status,'noresult');
    const sperm=extract(c,'differential')[1];
    seen[c.carryover?'carryover':'pure']=true;
    assert.equal(analyze(c,sperm,'auto').conclusion,c.carryover?'mixture':'single');
  } else if(type==='blood') {
    const [rich,poor]=extract(c,'classic');
    assert(rich.auto*policy.maxVolume>=policy.autoInput);
    assert(poor.auto*policy.maxVolume<policy.autoInput);
    assert.equal(poor.preferred,'defer');
    seen[c.donor==='U'?'unknown':'known']=true;
  } else {
    const e=extract(c,'classic')[0];
    assert.equal(e.preferred,'mt'); assert(e.mtQC);
    assert.equal(analyze(c,e,'auto').status,'noresult');
  }
}
assert(Object.values(seen).every(Boolean),'all biological result branches covered');
assert.throws(()=>makeCase(1,'unknown'));
assert.equal(autoLoci.length,21);
const boundaryCase=makeCase(81,'blood');
const base=extract(boundaryCase,'classic')[0];
assert.equal(analyze(boundaryCase,{...base,auto:policy.autoInput/policy.maxVolume,di:policy.autoDI},'auto').status,'profile');
assert.equal(analyze(boundaryCase,{...base,auto:policy.autoInput/policy.maxVolume-0.000001},'auto').status,'noresult');
assert.equal(analyze(boundaryCase,{...base,di:policy.autoDI+0.001},'auto').status,'noresult');
assert.equal(analyze(boundaryCase,{...base,y:policy.yInput/policy.maxVolume},'y').status,'profile');
assert.equal(analyze(boundaryCase,{...base,y:policy.yInput/policy.maxVolume-0.000001},'y').status,'noresult');
assert.equal(analyze(boundaryCase,{...base,yQC:false},'y').status,'noresult');
assert.equal(analyze(boundaryCase,{...base,mtQC:false,auto:0},'mt').status,'noresult','low nuclear DNA does not establish mtDNA feasibility');
assert.equal(analyze(boundaryCase,{...base,mtQC:true,auto:0},'mt').status,'profile','independent mtDNA feasibility can permit a result');

console.log('MG2: 450 reproducible cases; extraction, quantification, routing, mixture and lineage grading passed.');
