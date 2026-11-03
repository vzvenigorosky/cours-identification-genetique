/* Fictional bilingual narrative requisitions. Separate from FNAEG forms. */
window.NARRATIVE_REQUISITIONS = (function () {
  "use strict";
  const S = window.REQUISITION_SHARED;
  if (!S) throw Error("requisition-shared.js must be loaded before requisitions-narrative.js");
  const t = (fr,en) => ({fr,en});
  const SCENARIOS = ["johnDoe","sexualAssault"];
  const MODES = ["singleItem","multipleItems","closeKin","distantKin","mixed","none"];
  const PLACES = ["Lyon","Rennes","Toulouse","Dijon","Strasbourg","Nantes"];
  const SURNAMES = S.SURNAMES;
  const GIVEN = ["Camille","Alex","Morgan","Lou","Sacha","Claude","Dominique"];
  const REMAINS = [
    {id:"woodland",label:t("fragment de fémur","femur fragment"),background:t("Des restes humains non identifiés ont été découverts dans une zone boisée près de {place}. Aucun document d'identité n'était présent.","Unidentified human remains were discovered in woodland near {place}. No identity document was found.")},
    {id:"river",label:t("dent prélevée sur les restes","tooth recovered from the remains"),background:t("Un corps non identifié a été découvert à proximité d'un cours d'eau dans le secteur de {place}. Son état ne permet pas une identification visuelle fiable.","An unidentified body was discovered near a watercourse in the {place} area. Its condition does not allow reliable visual identification.")},
    {id:"building",label:t("fragment osseux","bone fragment"),background:t("Des restes humains ont été découverts dans un bâtiment désaffecté à {place}. Leur identité demeure inconnue.","Human remains were found in a disused building in {place}. Their identity remains unknown.")},
    {id:"fire",label:t("dent issue de restes altérés par la chaleur","tooth from heat-altered remains"),background:t("Des restes humains ont été découverts après un incendie près de {place}. Une identification morphologique n'a pas été possible.","Human remains were found after a fire near {place}. Morphological identification has not been possible.")}
  ];
  // Each sexual-assault template states, in a clean request: the alleged act,
  // whether the complainant reports an ejaculation (and where), the delay before
  // the medical examination, and for every seal its nature/site and why it is
  // relevant. The wording depends on the parties (complainant's and alleged
  // assailant's sex, gendered or neutral style) drawn per case in
  // requisition-shared.js. `{h}` is replaced by the examination delay in hours.
  const EXAM = t("recueilli lors de l'examen médico-légal, environ {h} h après les faits allégués","collected during the forensic medical examination, about {h} h after the alleged events");
  const ASSAULTS = [
    {id:"flat", build(p) {
       const v=S.victim(p),a=S.author(p),pen=S.penetration(p);
       return {
         background:t(v.a.fr+" a déposé plainte pour des faits d'agression sexuelle qui se seraient produits dans un appartement à {place}. "+v.Subj.fr+" décrit "+pen.act.fr+" et indique que "+a.noun.fr+" a embrassé son cou.",
                      v.a.en+" reported a sexual assault said to have occurred in a flat in {place}. "+v.Subj.en+" describe"+v.s+" "+pen.act.en+" and state"+v.s+" that the alleged assailant kissed "+v.poss+" neck."),
         ejaculation:[{status:"yes",site:pen.site},{status:"no",site:null},{status:"unknown",site:null}],
         items:[[pen.swab,EXAM],
                [t("sous-vêtement porté après les faits","underwear worn after the events"),t("remis par "+v.noun.fr+" lors du dépôt de plainte","provided by "+v.noun.en+" when the report was made")],
                [t("écouvillon cutané du cou (zone embrassée)","neck skin swab (area kissed)"),EXAM]]};
     }},
    {id:"street", build(p) {
       const v=S.victim(p),a=S.author(p);
       return {
         background:t(v.a.fr+" rapporte des attouchements imposés à {place}. "+v.Subj.fr+" décrit des attouchements des parties intimes sous les vêtements et indique avoir griffé "+a.noun.fr+" en se débattant.",
                      v.a.en+" reports non-consensual touching in {place}. "+v.Subj.en+" describe"+v.s+" touching of intimate areas under the clothing and state"+v.s+" that "+v.subj.en+" scratched the alleged assailant while struggling."),
         ejaculation:[{status:"no",site:null},{status:"yes",site:"garment"},{status:"unknown",site:null}],
         items:[[t("prélèvements sous-unguéaux","fingernail scrapings"),t("recueillis lors de l'examen médico-légal, environ {h} h après les faits allégués, car "+v.noun.fr+" déclare avoir griffé "+a.noun.fr,"collected during the forensic medical examination, about {h} h after the alleged events, because "+v.noun.en+" states having scratched the alleged assailant")],
                [t("vêtement porté au moment des faits","garment worn during the alleged incident"),t("remis par "+v.noun.fr,"provided by "+v.noun.en)]]};
     }},
    {id:"vehicle", build(p) {
       const v=S.victim(p);
       return {
         background:t(v.a.fr+" déclare avoir subi une agression sexuelle à bord d'un véhicule près de {place}. "+v.Subj.fr+" décrit un acte bucco-génital imposé sur le siège passager.",
                      v.a.en+" reports a sexual assault in a vehicle near {place}. "+v.Subj.en+" describe"+v.s+" an oral-genital act forced on "+v.obj+" on the passenger seat."),
         ejaculation:[{status:"yes",site:"mouth"},{status:"yes",site:"seat"},{status:"no",site:null},{status:"unknown",site:null}],
         items:[[S.oralEvidenceSwab(p),EXAM],
                [t("découpe de tissu du siège passager (lieu de l'acte allégué)","cutting of the passenger seat fabric (place of the alleged act)"),t("prélevée dans le véhicule","taken from the vehicle")],
                [t("haut porté par "+v.noun.fr,"top worn by "+v.noun.en),t("remis après les faits allégués","provided after the alleged events")]]};
     }}
  ];
  const ITEMS = [
    [t("brosse à dents","toothbrush"),t("trouvée dans la salle de bains du dernier domicile connu de la personne signalée disparue","found in the bathroom of the last known home of the reported missing person")],
    [t("rasoir","razor"),t("trouvé dans une trousse de toilette au dernier domicile connu de la personne signalée disparue","found in a wash bag at the last known home of the reported missing person")],
    [t("peigne","comb"),t("trouvé dans la chambre du dernier domicile connu de la personne signalée disparue","found in a bedroom of the last known home of the reported missing person")],
    [t("casquette","cap"),t("trouvée dans un placard du dernier domicile connu de la personne signalée disparue","found in a cupboard at the last known home of the reported missing person")],
    [t("gourde","water bottle"),t("trouvée sur une étagère du dernier domicile connu de la personne signalée disparue","found on a shelf at the last known home of the reported missing person")]
  ];
  const CLOSE = [
    {id:"mother",path:["candidate","mother"],desc:t("mère biologique présumée","reported biological mother"),sex:"F"},
    {id:"father",path:["candidate","father"],desc:t("père biologique présumé","reported biological father"),sex:"M"},
    {id:"fullSibling",path:["candidate","sharedParents","sibling"],desc:t("frère ou sœur germain(e) présumé(e)","reported full sibling")},
    {id:"child",path:["candidate","child"],desc:t("enfant biologique présumé","reported biological child")}
  ];
  const DISTANT = [
    {id:"firstCousin",path:["candidate","parent","sharedGrandparents","auntOrUncle","cousin"],desc:t("cousin(e) germain(e) présumé(e) : grands-parents communs allégués","reported first cousin: claimed shared grandparents")},
    {id:"secondCousin",path:["candidate","grandparent","sharedGreatGrandparents","otherGrandchild","cousin"],desc:t("cousin(e) issu(e) de germains présumé(e) : arrière-grands-parents communs allégués","reported second cousin: claimed shared great-grandparents")},
    {id:"greatAunt",path:["candidate","grandparent","sharedParentsWithGrandparent","greatAunt"],desc:t("grand-tante présumée : sœur d'un grand-parent","reported great-aunt: sibling of a grandparent"),sex:"F"},
    {id:"thirdCousin",path:["candidate","lineageToGreatGreatGrandparents","sharedGreatGreatGrandparents","otherDescendantLine","relative"],desc:t("parent éloigné : arrière-arrière-grands-parents communs allégués","reported third cousin: claimed shared great-great-grandparents")},
    {id:"fourthCousin",path:["candidate","lineageToThreeTimesGreatGrandparents","sharedThreeTimesGreatGrandparents","otherDescendantLine","relative"],desc:t("parent très éloigné : arrière-arrière-arrière-grands-parents communs allégués","reported fourth cousin: claimed shared three-times-great-grandparents")}
  ];
  function rng(seed) {
    let x = (Number(seed) >>> 0) || 0x6d2b79f5;
    const float = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
    const int = (a,b) => a + Math.floor(float() * (b-a+1));
    const pick = a => a[int(0,a.length-1)];
    const shuffle = a => { const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=int(0,i);[b[i],b[j]]=[b[j],b[i]];} return b; };
    return {float,int,pick,shuffle};
  }
  // One reported family per missing person. The references are alleged, not verified.
  const MALE_NAMES = S.MALE_NAMES, FEMALE_NAMES = S.FEMALE_NAMES;
  function buildPedigree(r) {
    const birthYear=2026-r.int(30,44),surname=r.pick(SURNAMES),
          maiden=r.pick(SURNAMES.filter(n=>n!==surname)), used=new Set();
    function make(sex,surname,year) {
      const first=(sex==="M"?MALE_NAMES:FEMALE_NAMES).filter(n=>!used.has(n+" "+surname));
      const name=r.pick(first.length?first:sex==="M"?MALE_NAMES:FEMALE_NAMES)+" "+surname;
      used.add(name);
      return {name,sex,surname,birthYear:year,birthDate:
        String(r.int(1,28)).padStart(2,"0")+"/"+String(r.int(1,12)).padStart(2,"0")+"/"+year};
    }
    const candidate=make(r.pick(["M","F"]),surname,birthYear);
    const father=make("M",surname,birthYear-r.int(24,35));
    const mother=make("F",maiden,birthYear-r.int(22,34));
    const sibling=make(r.pick(["M","F"]),surname,birthYear+r.pick([-8,-6,-4,-2,2,4,6,8]));
    // Patrilineal birth surname: the candidate's child carries the candidate's
    // surname only if the candidate is male; a female candidate's child takes
    // its own father's (different) surname.
    const childSurname=candidate.sex==="M"?surname:r.pick(SURNAMES.filter(n=>n!==surname));
    const child=birthYear<=1987?make(r.pick(["M","F"]),childSurname,birthYear+r.int(21,2026-birthYear-18)):null;
    const grandfather=make("M",surname,father.birthYear-r.int(20,28));
    const grandmother=make("F",r.pick(SURNAMES.filter(n=>n!==surname)),grandfather.birthYear+r.int(-6,8));
    const greatGrandfather=make("M",surname,grandfather.birthYear-r.int(23,32));
    const greatGreatGrandfather=make("M",surname,greatGrandfather.birthYear-r.int(23,32));
    const greatGreatGreatGrandfather=make("M",surname,greatGreatGrandfather.birthYear-r.int(23,32));
    const auntYear=grandfather.birthYear+r.int(-5,8);
    const greatAunt=auntYear>=1931?make("F",surname,auntYear):null;
    const ancestors={firstCousin:grandfather,secondCousin:greatGrandfather,greatAunt:greatGrandfather,
      thirdCousin:greatGreatGrandfather,fourthCousin:greatGreatGreatGrandfather};
    const people={father,mother,fullSibling:sibling,child,greatAunt};
    function relative(id) {
      if(people[id])return people[id];
      // A first cousin on the paternal male line shares the surname; more distant
      // collaterals carry an independent surname (not the paternal one).
      const sn=id==="firstCousin"?surname:r.pick(SURNAMES.filter(n=>n!==surname));
      return make(r.pick(["M","F"]),sn,birthYear+r.int(-11,11));
    }
    return {candidate,father,mother,sibling,child,grandfather,grandmother,greatAunt,ancestors,relative};
  }
  const substitute = (pair,place) => t(pair.fr.replace("{place}",place),pair.en.replace("{place}",place));
  function base(r,scenario,template,place) {
    return {type:"narrative",scenario,caseId:template.id,referenceMode:null,seed:null,
      requerant:{nom:r.pick(SURNAMES),prenom:r.pick(GIVEN),grade:"OFFICIER DE POLICE JUDICIAIRE",service:"UNITE PEDAGOGIQUE "+place.toUpperCase(),procedure:r.int(100,9999)+"/2026"},
      place:t(place,place),eventDate:String(r.int(1,28)).padStart(2,"0")+"/"+String(r.int(1,12)).padStart(2,"0")+"/"+String(r.int(2022,2025)),
      objective:null,question:t("",""),narrative:substitute(template.background,place),
      mission:t("Procéder aux examens génétiques utiles à l'enquête, préciser les limites d'interprétation et rendre compte des résultats. Signaler toute information ou référence complémentaire nécessaire.","Carry out genetic examinations relevant to the investigation, explain interpretative limitations and report results. Indicate any further information or reference material needed."),
      exhibits:[],references:[],referenceStatus:t("",""),facts:{stated:{},withheld:{}},
      quality:{vague:false,sloppy:false},degraded:[]};
  }
  function exhibit(data,kind,label,provenance) {
    const e={id:"S"+(data.exhibits.length+1),kind,label,provenance};data.exhibits.push(e);return e;
  }
  function addRef(data,kind,exhibitData,claimedSource,relationship) {
    data.references.push({id:"R"+(data.references.length+1),exhibitId:exhibitData.id,kind,
      label:exhibitData.label,provenance:exhibitData.provenance,claimedSource,relationship:relationship||null});
  }
  // Sex-agreeing description of a reported relationship (both languages).
  function relationDesc(id,sex) {
    const f=sex==="F";
    switch(id){
      case "mother": return t("mère biologique présumée","reported biological mother");
      case "father": return t("père biologique présumé","reported biological father");
      case "fullSibling": return f?t("sœur germaine présumée","reported full sister"):t("frère germain présumé","reported full brother");
      case "child": return f?t("fille biologique présumée","reported biological daughter"):t("fils biologique présumé","reported biological son");
      case "firstCousin": return f?t("cousine germaine présumée : grands-parents communs allégués","reported first cousin: claimed shared grandparents")
                                  :t("cousin germain présumé : grands-parents communs allégués","reported first cousin: claimed shared grandparents");
      case "secondCousin": return f?t("cousine issue de germains présumée : arrière-grands-parents communs allégués","reported second cousin: claimed shared great-grandparents")
                                   :t("cousin issu de germains présumé : arrière-grands-parents communs allégués","reported second cousin: claimed shared great-grandparents");
      case "greatAunt": return t("grand-tante présumée : sœur d'un grand-parent","reported great-aunt: sibling of a grandparent");
      case "thirdCousin": return t("parent éloigné présumé : arrière-arrière-grands-parents communs allégués","reported distant relative: claimed shared great-great-grandparents");
      case "fourthCousin": return t("parent éloigné présumé : arrière-arrière-arrière-grands-parents communs allégués","reported distant relative: claimed shared three-times-great-grandparents");
      default: return t("parent présumé","reported relative");
    }
  }
  const born=(sex)=>sex==="F"?"née le ":"né le ";
  function makeJohnDoe(r,mode) {
    const template=r.pick(REMAINS),data=base(r,"johnDoe",template,r.pick(PLACES));
    const family=buildPedigree(r),candidate=family.candidate;
    data.referenceMode=mode;data.candidate=candidate.name;data.candidatePerson=candidate;
    data.family={father:family.father,mother:family.mother,
      paternalGrandfather:family.grandfather,paternalGrandmother:family.grandmother};
    data.objective=t("Rechercher les éléments génétiques utiles à l'identification des restes humains non identifiés.","Seek genetic information relevant to identifying the unidentified human remains.");
    exhibit(data,"unknownRemains",template.label,t("prélevé sur les restes non identifiés","sampled from the unidentified remains"));
    if(mode!=="none") {
      data.narrative.fr+=" Une comparaison avec "+candidate.name+" ("+born(candidate.sex)+candidate.birthDate+
        "), personne signalée disparue, est envisagée sans que cette identité soit établie.";
      data.narrative.en+=" A comparison with "+candidate.name+" (born "+candidate.birthDate+
        "), a reported missing person, is being considered without any identification established.";
    }
    if(["singleItem","multipleItems","mixed"].includes(mode)) {
      const count=mode==="singleItem"?1:mode==="multipleItems"?r.int(2,4):r.int(1,3);
      for(const item of r.shuffle(ITEMS).slice(0,count)) {
        const e=exhibit(data,"personalItem",item[0],item[1]);
        addRef(data,"personalItem",e,t("appartenance alléguée à "+candidate.name,"claimed belonging of "+candidate.name));
      }
    }
    if(["closeKin","distantKin","mixed"].includes(mode)) {
      const close=CLOSE.filter(x=>x.id!=="child"||family.child);
      const distant=DISTANT.filter(x=>x.id!=="greatAunt"||family.greatAunt);
      const pool=mode==="closeKin"?close:mode==="distantKin"?distant:r.pick([close,distant]);
      const count=mode==="mixed"?r.int(1,2):r.int(1,Math.min(3,pool.length));
      for(const rel of r.shuffle(pool).slice(0,count)) {
        const p=family.relative(rel.id),title=p.sex==="M"?"M.":"Mme",desc=relationDesc(rel.id,p.sex);
        const e=exhibit(data,"relativeSample",
          t("écouvillon buccal de "+title+" "+p.name,"cheek swab from "+title+" "+p.name),
          t("prélèvement de comparaison communiqué par les enquêteurs","comparison sample provided by investigators"));
        const ancestor=family.ancestors[rel.id];
        addRef(data,"relative",e,
          t(title+" "+p.name+" ("+born(p.sex)+p.birthDate+") : "+desc.fr+" de "+candidate.name,
            title+" "+p.name+" (born "+p.birthDate+"): "+desc.en+" of "+candidate.name),
          {id:rel.id,path:rel.path.slice(),summary:desc,candidate:candidate.name,
           relativePerson:p,commonAncestor:ancestor?{name:ancestor.name,birthYear:ancestor.birthYear}:null});
      }
    }
    const items=data.references.some(x=>x.kind==="personalItem");
    const relatives=data.references.some(x=>x.kind==="relative");
    data.referenceStatus=mode==="none"
      ?t("Aucune référence de comparaison n'est disponible à ce stade.","No comparison reference material is currently available.")
      :items&&relatives
        ?t("L'attribution des objets et les liens de parenté mentionnés restent à vérifier.","The attribution of the items and reported relationships remain to be verified.")
        :items
          ?t("L'attribution des effets personnels à la personne disparue reste à vérifier.","The attribution of personal items to the missing person remains to be verified.")
          :t("Les liens de parenté déclarés avec la personne disparue restent à vérifier.","The claimed relationships with the missing person remain to be verified.");
    data.facts.stated.referenceStatus=data.referenceStatus;
    const seals=data.references.map(x=>x.exhibitId).join(", ");
    data.question=mode==="none"
      ?t("Question posée : le scellé S1 permet-il d'établir un profil génétique exploitable pour une comparaison ultérieure ?",
         "Question put to you: can exhibit S1 yield a genetic profile that is usable for a later comparison?")
      :t("Question posée : le scellé S1 permet-il d'établir un profil génétique exploitable et, le cas échéant, ce profil est-il compatible avec les références jointes ("+seals+") ?",
         "Question put to you: can exhibit S1 yield a usable genetic profile and, if so, is it compatible with the references enclosed ("+seals+")?");
    return data;
  }
  function makeAssault(r) {
    const tpl=r.pick(ASSAULTS),parties=S.drawParties(r),template=Object.assign({id:tpl.id},tpl.build(parties));
    const V=S.victim(parties),M=S.suspect(parties);
    const data=base(r,"sexualAssault",template,r.pick(PLACES));
    data.parties=parties;
    const hours=r.pick([3,6,12,24,36,48]),fill=pair=>t(pair.fr.replace("{h}",hours),pair.en.replace("{h}",hours));
    const ejac=r.pick(template.ejaculation);
    data.objective=t("Rechercher d'éventuelles traces biologiques utiles à l'enquête et évaluer les comparaisons envisageables.","Examine possible biological traces relevant to the investigation and assess available comparisons.");
    // Clean request: the alleged act, the reported ejaculation (or its absence)
    // and the delay before the examination are all stated explicitly.
    const ejSentence=S.ejaculation(parties,ejac.status,ejac.site),delaySentence=S.examDelay(hours);
    data.narrative=t(data.narrative.fr+" "+ejSentence.fr+" "+delaySentence.fr,data.narrative.en+" "+ejSentence.en+" "+delaySentence.en);
    data.facts.stated.ejaculation={status:ejac.status,site:ejac.site,sentence:ejSentence};
    data.facts.stated.examDelayHours=hours;
    for(const item of template.items) exhibit(data,"evidence",item[0],fill(item[1]));
    const victim=r.float()<0.7,suspect=r.float()<0.35;
    for(const [enabled,who] of [[victim,"complainant"],[suspect,"suspect"]]) {
      if(!enabled)continue;
      const ref=S.referenceSwab(parties,who);
      const e=exhibit(data,"knownReference",ref.label,ref.provenance);
      e.role=who;
      addRef(data,"knownReference",e,ref.claimedSource);
    }
    data.referenceStatus=victim&&suspect
      ?t("Les références "+V.of.fr+" et "+M.of.fr+" figurent parmi les scellés.","The references of "+V.noun.en+" and of "+M.noun.en+" are among the exhibits.")
      :victim
        ?t("Seule la référence "+V.of.fr+" est jointe ; aucune personne mise en cause n'est référencée à ce stade.","Only the reference of "+V.noun.en+" is enclosed; no person under investigation has been sampled at this stage.")
        :suspect
          ?t("Seule la référence "+M.of.fr+" est jointe ; aucune référence "+V.of.fr+" n'est disponible.","Only the reference of "+M.noun.en+" is enclosed; no reference of "+V.noun.en+" is available.")
          :t("Aucune référence n'est jointe à ce stade, ni "+V.of.fr+" ni "+M.of.fr+".","No reference is enclosed at present, neither from "+V.noun.en+" nor from "+M.noun.en+".");
    data.facts.stated.referenceStatus=data.referenceStatus;
    data.facts.stated.referenceAvailability=victim||suspect;
    const ev=data.exhibits.filter(x=>x.kind==="evidence").map(x=>x.id).join(", "),A=S.author(parties);
    data.question=victim||suspect
      ?t("Question posée : les scellés "+ev+" contiennent-ils du matériel biologique "+A.of.fr+" ? Le cas échéant, le profil obtenu est-il exploitable et comparable aux références jointes ?",
         "Question put to you: do exhibits "+ev+" contain biological material from the alleged assailant? If so, is the profile obtained usable and comparable with the references enclosed?")
      :t("Question posée : les scellés "+ev+" contiennent-ils du matériel biologique "+A.of.fr+" ? Le cas échéant, le profil obtenu est-il exploitable pour une comparaison ultérieure ?",
         "Question put to you: do exhibits "+ev+" contain biological material from the alleged assailant? If so, is the profile obtained usable for a later comparison?");
    return data;
  }
  function degrade(data,opts,r) {
    if(opts.vague) {
      const options=[];
      const kin=data.references.find(ref=>ref.kind==="relative");
      const item=data.references.find(ref=>ref.kind==="personalItem");
      if(kin) options.push({field:"references."+kin.id+".claimedSource",archetype:"relationship-path-unstated",
        change() {
          const was=kin.claimedSource,p=kin.relationship.relativePerson,name=(p.sex==="F"?"Mme ":"M. ")+p.name;
          const candidate=kin.relationship.candidate;
          kin.claimedSource=t(name+" ("+born(p.sex)+p.birthDate+") : prélèvement proposé pour comparaison avec "+candidate,
                              name+" (born "+p.birthDate+"): sample offered for comparison with "+candidate);
          return was;
        },
        note:t("Le lien de parenté allégué est absent ; demander un pedigree explicite.",
               "The alleged kinship relationship is missing; request an explicit pedigree.")});
      if(item) options.push({field:"references."+item.id+".claimedSource",archetype:"comparison-attribution-unstated",
        change() {
          const was=item.claimedSource;
          item.claimedSource=t("Effet personnel proposé pour comparaison génétique.",
                               "Personal item proposed for genetic comparison.");
          return was;
        },
        note:t("Le requérant n'indique pas à qui cet effet personnel est attribué.",
               "The requester does not specify whose item this is claimed to be.")});
      if(data.scenario==="sexualAssault") {
        const ej=data.facts.stated.ejaculation;
        options.push({field:"narrative.ejaculation",archetype:"ejaculation-unstated",
          change() {
            // Silent omission: the sentence is simply absent from the narrative.
            const was=ej.sentence;
            data.narrative=t(data.narrative.fr.replace(" "+was.fr,""),data.narrative.en.replace(" "+was.en,""));
            return was;
          },
          note:t("La requête ne dit pas s'il y a eu éjaculation, ni où ; cela oriente les scellés à examiner en priorité et la recherche de sperme (extraction différentielle).",
                 "The request does not say whether ejaculation occurred or where; this guides which exhibits to examine first and the search for semen (differential extraction).")});
        const sw=data.exhibits.find(x=>x.kind==="knownReference"||/buccal|oral/i.test(x.label.fr+" "+x.label.en));
        if(sw) options.push({field:"exhibits."+sw.id+".label",archetype:"swab-source-unstated",
          change() {
            const was=t(sw.label.fr+" — "+sw.provenance.fr,sw.label.en+" — "+sw.provenance.en);
            // Name the swab generically: whose it is, and whether it relates to
            // the events or is a reference, are no longer stated (silently).
            sw.label=t("écouvillon buccal","cheek swab");
            sw.provenance=t("transmis sous scellé","submitted under seal");
            const ref=data.references.find(x=>x.exhibitId===sw.id);
            if(ref) {
              ref.label=sw.label; ref.provenance=sw.provenance; ref.claimedSource=t("écouvillon buccal","cheek swab");
              // The reference-status sentence must not name the donor either.
              data.referenceStatus=t("Des prélèvements de comparaison figurent parmi les scellés.","Comparison samples are included among the exhibits.");
            }
            return was;
          },
          note:t("On ne sait pas de qui provient cet écouvillon buccal ni s'il se rapporte aux faits ou s'il s'agit d'une référence ; demander l'identité du donneur et le motif du prélèvement.",
                 "It is not stated whose cheek swab this is, nor whether it relates to the events or is a reference; ask for the donor's identity and the reason for sampling.")});
        const e=data.exhibits.find(x=>x.kind==="evidence");
        if(e) options.push({field:"exhibits."+e.id+".label",archetype:"sample-nature-unstated",
          change() {
            const was=e.label;
            // Withhold the nature/site by naming the exhibit only generically —
            // do NOT flag the omission (no "contenu non détaillé"): the student
            // must notice that this scellé, unlike the others, is unspecified.
            e.label=t("un prélèvement","a sample");
            return was;
          },
          note:t("La nature ou le site du prélèvement n'est pas communiqué ; demander l'inventaire précis.",
                 "The sampling site or nature of the item is missing; request a precise inventory.")});
      }
      if(data.scenario==="johnDoe" && item) {
        const e=data.exhibits.find(x=>x.id===item.exhibitId);
        options.push({field:"exhibits."+e.id+".provenance",archetype:"exhibit-origin-unstated",
          change() {
            const was=e.provenance;
            e.provenance=t("objet transmis sous scellé","item submitted under seal");
            return was;
          },
          note:t("Le lieu et les circonstances de découverte de l'objet ne sont pas indiqués.",
                 "The item's location and collection circumstances are omitted.")});
      }
      if(!options.length) options.push({field:"referenceStatus",archetype:"comparison-status-unstated",
        change() {
          const was=data.referenceStatus;
          data.referenceStatus=t("La recherche d'éléments de comparaison se poursuit.",
                                 "Investigators are looking into possible comparison material.");
          return was;
        },
        note:t("Le dossier ne précise pas si des références sont disponibles.",
               "The case does not state whether comparison references are available.")});
      const change=r.pick(options),was=change.change();
      data.facts.withheld[change.field]=was;
      data.degraded.push({field:change.field,kind:"vague",archetype:change.archetype,was,note:change.note});
    }
    data.quality={vague:!!opts.vague};
    return data;
  }
  function generate(opts) {
    opts=opts||{};
    if(opts.scenario!=null&&opts.scenario!=="random"&&!SCENARIOS.includes(opts.scenario))throw Error("Unknown scenario");
    if(opts.referenceMode!=null&&opts.referenceMode!=="random"&&!MODES.includes(opts.referenceMode))throw Error("Unknown reference mode");
    const seed=opts.seed==null?Math.floor(Math.random()*4294967296):opts.seed;
    if(!Number.isInteger(Number(seed))||Number(seed)<0||Number(seed)>4294967295)throw Error("Invalid seed");
    const r=rng(seed),scenario=opts.scenario&&opts.scenario!=="random"?opts.scenario:r.pick(SCENARIOS);
    const mode=scenario==="johnDoe"?(opts.referenceMode&&opts.referenceMode!=="random"?opts.referenceMode:r.pick(MODES)):null;
    const d=scenario==="johnDoe"?makeJohnDoe(r,mode):makeAssault(r);
    d.seed=Number(seed);return degrade(d,opts,r);
  }
  return {generate,SCENARIOS:SCENARIOS.slice(),MODES:MODES.slice()};
})();