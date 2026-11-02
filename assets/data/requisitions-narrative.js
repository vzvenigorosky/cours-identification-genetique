/* Fictional bilingual narrative requisitions. Separate from FNAEG forms. */
window.NARRATIVE_REQUISITIONS = (function () {
  "use strict";
  const t = (fr,en) => ({fr,en});
  const SCENARIOS = ["johnDoe","sexualAssault"];
  const MODES = ["singleItem","multipleItems","closeKin","distantKin","mixed","none"];
  const PLACES = ["Lyon","Rennes","Toulouse","Dijon","Strasbourg","Nantes"];
  const SURNAMES = ["MARTIN","MOREL","LEGRAND","DUPUIS","GARNIER","ROUX","PERRIN"];
  const GIVEN = ["Camille","Alex","Morgan","Lou","Sacha","Claude","Dominique"];
  const REMAINS = [
    {id:"woodland",label:t("fragment de fémur","femur fragment"),background:t("Des restes humains non identifiés ont été découverts dans une zone boisée près de {place}. Aucun document d'identité n'était présent.","Unidentified human remains were discovered in woodland near {place}. No identity document was found.")},
    {id:"river",label:t("dent prélevée sur les restes","tooth recovered from the remains"),background:t("Un corps non identifié a été découvert à proximité d'un cours d'eau dans le secteur de {place}. Son état ne permet pas une identification visuelle fiable.","An unidentified body was discovered near a watercourse in the {place} area. Its condition does not allow reliable visual identification.")},
    {id:"building",label:t("fragment osseux","bone fragment"),background:t("Des restes humains ont été découverts dans un bâtiment désaffecté à {place}. Leur identité demeure inconnue.","Human remains were found in a disused building in {place}. Their identity remains unknown.")},
    {id:"fire",label:t("dent issue de restes altérés par la chaleur","tooth from heat-altered remains"),background:t("Des restes humains ont été découverts après un incendie près de {place}. Une identification morphologique n'a pas été possible.","Human remains were found after a fire near {place}. Morphological identification has not been possible.")}
  ];
  const ASSAULTS = [
    {id:"flat",background:t("Une personne a déposé plainte pour des faits d'agression sexuelle qu'elle déclare avoir subis dans un appartement à {place}. Des prélèvements ont été recueillis lors de son examen médico-légal.","A person reported a sexual assault said to have occurred in a flat in {place}. Samples were collected during a forensic medical examination."),
     items:[[t("écouvillon vaginal","vaginal swab"),t("recueilli lors de l'examen médico-légal","collected during the forensic medical examination")],[t("sous-vêtement remis par la personne plaignante","underwear provided by the complainant"),t("remis après les faits allégués","provided after the alleged events")],[t("écouvillon cutané du cou","neck skin swab"),t("recueilli lors de l'examen médico-légal","collected during the forensic medical examination")]]},
    {id:"street",background:t("Une personne rapporte avoir subi des attouchements imposés à {place} et indique avoir tenté de repousser l'auteur présumé. Des prélèvements et effets ont été placés sous scellés.","A person reports non-consensual touching in {place} and states that they tried to push the alleged assailant away. Samples and items were sealed as evidence."),
     items:[[t("prélèvements sous-unguéaux","fingernail scrapings"),t("recueillis lors de l'examen médico-légal","collected during the forensic medical examination")],[t("vêtement porté au moment des faits","garment worn during the alleged incident"),t("remis par la personne plaignante","provided by the complainant")]]},
    {id:"vehicle",background:t("Une personne déclare avoir subi une agression sexuelle à bord d'un véhicule près de {place}. Les enquêteurs transmettent des prélèvements médico-légaux et des objets saisis.","A person reports a sexual assault in a vehicle near {place}. Investigators submit forensic medical samples and seized items."),
     items:[[t("écouvillon buccal de trace","evidentiary oral swab"),t("recueilli lors de l'examen médico-légal","collected during the forensic medical examination")],[t("découpe de tissu du siège","seat fabric cutting"),t("prélevée dans le véhicule","taken from the vehicle")],[t("haut porté par la personne plaignante","top worn by the complainant"),t("remis après les faits allégués","provided after the alleged events")]]}
  ];
  const ITEMS = [
    [t("brosse à dents","toothbrush"),t("trouvée dans la salle de bains","found in the bathroom")],
    [t("rasoir","razor"),t("trouvé dans une trousse de toilette","found in a wash bag")],
    [t("peigne","comb"),t("trouvé dans une chambre","found in a bedroom")],
    [t("casquette","cap"),t("trouvée dans un placard","found in a cupboard")],
    [t("gourde","water bottle"),t("trouvée sur une étagère","found on a shelf")]
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
  const MALE_NAMES = ["Paul","Louis","Thomas","Nicolas","Pierre","Jean","Hugo","Marc","Luc","David","Émile","Alexandre","Simon","Julien","Arthur","Gabriel"];
  const FEMALE_NAMES = ["Marie","Claire","Sophie","Louise","Jeanne","Anne","Julie","Alice","Léa","Emma","Élise","Camille","Lucie","Chloé","Sarah","Agathe"];
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
      objective:null,narrative:substitute(template.background,place),
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
    return data;
  }
  function makeAssault(r) {
    const template=r.pick(ASSAULTS),data=base(r,"sexualAssault",template,r.pick(PLACES));
    data.objective=t("Rechercher d'éventuelles traces biologiques utiles à l'enquête et évaluer les comparaisons envisageables.","Examine possible biological traces relevant to the investigation and assess available comparisons.");
    for(const item of template.items) exhibit(data,"evidence",item[0],item[1]);
    const victim=r.float()<0.7,suspect=r.float()<0.35;
    for(const [enabled,role] of [[victim,t("personne plaignante","complainant")],[suspect,t("personne mise en cause","person under investigation")]]) {
      if(!enabled)continue;
      const e=exhibit(data,"knownReference",t("écouvillon buccal de référence — "+role.fr,"reference cheek swab — "+role.en),t("prélèvement transmis pour comparaison","sample provided for comparison"));
      addRef(data,"knownReference",e,role);
    }
    data.referenceStatus=victim||suspect
      ?t("Les prélèvements de référence disponibles figurent parmi les scellés.","Available reference samples are included among the exhibits.")
      :t("Aucun prélèvement de référence n'est joint à ce stade.","No reference samples are attached at present.");
    data.facts.stated.referenceStatus=data.referenceStatus;
    data.facts.stated.referenceAvailability=victim||suspect;
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