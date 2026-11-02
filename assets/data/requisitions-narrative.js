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
  const person = r => r.pick(GIVEN)+" "+r.pick(SURNAMES);
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
  function makeJohnDoe(r,mode) {
    const template=r.pick(REMAINS),data=base(r,"johnDoe",template,r.pick(PLACES));
    data.referenceMode=mode;data.candidate=person(r);
    data.objective=t("Rechercher les éléments génétiques utiles à l'identification des restes humains non identifiés.","Seek genetic information relevant to identifying the unidentified human remains.");
    exhibit(data,"unknownRemains",template.label,t("prélevé sur les restes non identifiés","sampled from the unidentified remains"));
    if(mode!=="none") {
      data.narrative.fr+=" Une comparaison avec la personne disparue "+data.candidate+" est envisagée, sans identification préalable.";
      data.narrative.en+=" Investigators are considering a comparison with the missing person "+data.candidate+"; no identification has been established.";
    }
    if(["singleItem","multipleItems","mixed"].includes(mode)) {
      const number=mode==="singleItem"?1:mode==="multipleItems"?r.int(2,4):r.int(1,3);
      for(const item of r.shuffle(ITEMS).slice(0,number)) {
        const provenance=item[1]; // physical origin; claimed ownership is exclusively in the reference statement
        const e=exhibit(data,"personalItem",item[0],provenance);
        addRef(data,"personalItem",e,t("appartenance alléguée à "+data.candidate,"claimed belonging of "+data.candidate));
      }
    }
    if(["closeKin","distantKin","mixed"].includes(mode)) {
      const pool=mode==="closeKin"?CLOSE:mode==="distantKin"?DISTANT:r.pick([CLOSE,DISTANT]);
      const number=mode==="mixed"?r.int(1,2):r.int(1,3);
      const usedNames=new Set();
      for(const rel of r.shuffle(pool).slice(0,number)) {
        let name;
        do {
          const title=rel.sex==="F"?"Mme":rel.sex==="M"?"M.":r.pick(["Mme","M."]);
          name=title+" "+person(r);
        } while(usedNames.has(name));
        usedNames.add(name);
        const e=exhibit(data,"relativeSample",t("écouvillon buccal de "+name,"cheek swab from "+name),t("prélèvement de comparaison communiqué par les enquêteurs","comparison sample provided by investigators"));
        addRef(data,"relative",e,t(name+" : "+rel.desc.fr+" de "+data.candidate,name+": "+rel.desc.en+" of "+data.candidate),
          {id:rel.id,path:rel.path.slice(),summary:rel.desc,candidate:data.candidate});
      }
    }
    const hasItems=data.references.some(ref=>ref.kind==="personalItem");
    const hasKin=data.references.some(ref=>ref.kind==="relative");
    data.referenceStatus=mode==="none"
      ?t("Aucune référence de comparaison n'est disponible à ce stade.","No comparison reference material is currently available.")
      :hasItems && hasKin
        ?t("L'attribution des objets et les liens de parenté mentionnés restent à vérifier.","The attribution of the items and reported relationships remain to be verified.")
        :hasItems
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
      if(kin)options.push({field:"references."+kin.id+".claimedSource",archetype:"relationship-path-unstated",
        change(){const was=kin.claimedSource;kin.claimedSource=t("lien de parenté non précisé","kinship relationship not stated");return was;},
        note:t("Le lien exact de parenté doit être demandé au requérant.","The precise claimed kinship relationship must be obtained from the requester.")});
      if(item)options.push({field:"references."+item.id+".claimedSource",archetype:"comparison-provenance-unstated",
        change(){const was=item.claimedSource;item.claimedSource=t("appartenance non précisée","ownership not stated");return was;},
        note:t("L'attribution de l'effet personnel n'est pas précisée.","The attribution of the personal item is not stated.")});

      const e=data.exhibits.find(x=>x.kind==="evidence"||x.kind==="personalItem");
      if(e)options.push({field:"exhibits."+e.id+".provenance",archetype:"exhibit-origin-unstated",
        change(){const was=e.provenance;e.provenance=t("origine non précisée","origin not stated");return was;},
        note:t("L'origine d'un scellé est omise.","The origin of an exhibit is omitted.")});
      // In a no-reference identification request the explicitly reported absence is
      // itself a decisive fact: withholding it is different from having no references.
      if(!options.length)options.push({field:"referenceStatus",archetype:"comparison-status-unstated",
        change(){const was=data.referenceStatus;data.referenceStatus=t("Disponibilité des références non précisée.","Reference availability not stated.");return was;},
        note:t("Il faut demander si des références sont disponibles ou pourraient être obtenues.","Ask whether comparison references exist or could be obtained.")});
      const change=r.pick(options),was=change.change();
      data.facts.withheld[change.field]=was;
      data.degraded.push({field:change.field,kind:"vague",archetype:change.archetype,was,note:change.note});
    }
    if(opts.sloppy) {
      const was=data.requerant.grade;data.requerant.grade="OPJ";
      data.degraded.push({field:"requerant.grade",kind:"sloppy",was,
        note:t("Le grade est abrégé au lieu d'être rédigé en entier.","The rank is abbreviated rather than written in full.")});
    }
    data.quality={vague:!!opts.vague,sloppy:!!opts.sloppy};
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