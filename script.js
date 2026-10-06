const $=id=>document.getElementById(id), clamp=(n,min=1,max=7)=>Math.max(min,Math.min(max,Number(n)||min));

// Calendrier officiel MotoGP 2026 — 22 circuits
const OFFICIAL_2026_CIRCUITS=[
  'Buriram','Goiânia','Austin','Jerez','Le Mans','Barcelona',
  'Mugello','Balaton Park','Brno','Assen','Sachsenring','Silverstone',
  'MotorLand Aragón','Misano','Spielberg','Motegi','Mandalika',
  'Phillip Island','Sepang','Lusail','Portimão','Valence'
];

const SETUP_KEYS=[
  'preloadFront','oilFront','springFront','compFront','extFront',
  'preloadRear','springRear','compRear','extRear','swingarm',
  'g1','g2','g3','g4','g5','g6','final','antiDribble',
  'tcs','aw','ebs','frontRideHeight','rearRideHeight','trail','offset',
  'frontTyre','rearTyre','frontBrake','rearBrake'
];

const LABELS={
  preloadFront:'Précharge avant',
  oilFront:'Quantité d’huile avant',
  springFront:'Dureté ressort avant',
  compFront:'Compression fourche avant',
  extFront:'Extension fourche avant',

  preloadRear:'Précharge arrière',
  springRear:'Dureté ressort arrière',
  compRear:'Compression mono arrière',
  extRear:'Extension mono arrière',
  swingarm:'Bras oscillant arrière / connecteur',

  g1:'1ère vitesse',
  g2:'2ème vitesse',
  g3:'3ème vitesse',
  g4:'4ème vitesse',
  g5:'5ème vitesse',
  g6:'6ème vitesse',
  final:'Rapport final',
  antiDribble:'Anti-dribble / Engine Brake Slip',

  tcs:'TCS (antipatinage)',
  aw:'Anti-wheelie',
  ebs:'EBS (frein moteur)',

  frontRideHeight:'Hauteur avant',
  rearRideHeight:'Hauteur arrière',
  trail:'Chasse',
  offset:'Déport'
};

const base=()=>({
  preloadFront:4,
  oilFront:4,
  springFront:4,
  compFront:4,
  extFront:4,

  preloadRear:4,
  springRear:4,
  compRear:4,
  extRear:4,
  swingarm:4,

  g1:4,
  g2:4,
  g3:4,
  g4:4,
  g5:4,
  g6:4,
  final:4,
  antiDribble:4,

  tcs:3,
  aw:3,
  ebs:3,

  frontRideHeight:4,
  rearRideHeight:4,
  trail:4,
  offset:4,

  frontTyre:'Medium',
  rearTyre:'Soft',

  frontBrake:'340 mm (standard)',
  rearBrake:'220 mm (standard)'
});

let state=
JSON.parse(localStorage.getItem('vmv_setup_v4')||'null')||
{
  generated:null,
  published:[],
  history:[],
  fingerprints:[],
  versions:0
};

state.manualSetup={
  ...base(),
  ...(state.manualSetup||{})
};

function save(){
  localStorage.setItem(
    'vmv_setup_v4',
    JSON.stringify(state)
  );
  renderAll();
}

function persistState(){
  localStorage.setItem(
    'vmv_setup_v4',
    JSON.stringify(state)
  );
}

function ctx(){
  return{
    game:$('game').value,
    bike:$('bike').value,
    track:$('track').value,
    weather:$('weather').value,
    phase:$('phase').value,
    problem:$('problem').value,
    comment:$('comment').value.trim()
  };
}

function escHTML(v){
  return String(v??'').replace(
    /[&<>"']/g,
    m=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m])
  );
}

function selectOptions(id,selected){
  const el=$(id);

  return el
    ? Array.from(el.options)
      .map(o=>
        `<option value="${escHTML(o.value)}"
        ${o.value===selected?'selected':''}>
        ${escHTML(o.textContent)}
        </option>`
      )
      .join('')
    : '';
}


// ======================================================
// CONTEXTE COACH IA
// ======================================================

function renderContext(){

  const c=ctx();

  $('coachContext').innerHTML=`

    <div class="context-note">

      🔧 <b>Tu peux modifier directement le contexte ici.</b>

      Les changements sont immédiatement utilisés
      par le diagnostic et le Coach Expert.

    </div>

    <div class="coach-controls">

      <div class="coach-field">
        <label>Jeu</label>
        <select id="coachGame">
          ${selectOptions('game',c.game)}
        </select>
      </div>

      <div class="coach-field">
        <label>Moto</label>
        <select id="coachBike">
          ${selectOptions('bike',c.bike)}
        </select>
      </div>

      <div class="coach-field">
        <label>🏁 Circuit</label>
        <select id="coachTrack">
          ${selectOptions('track',c.track)}
        </select>
      </div>

      <div class="coach-field">
        <label>☁ Météo</label>
        <select id="coachWeather">
          ${selectOptions('weather',c.weather)}
        </select>
      </div>

      <div class="coach-field">
        <label>🎯 Phase de pilotage</label>
        <select id="coachPhase">
          ${selectOptions('phase',c.phase)}
        </select>
      </div>

      <div class="coach-field">
        <label>⚠ Problème ressenti</label>
        <select id="coachProblem">
          ${selectOptions('problem',c.problem)}
        </select>
      </div>

      <div class="coach-field full">
        <label>📝 Commentaire pilote</label>

        <textarea
          id="coachComment"
          rows="3"
          placeholder="Ex : l'arrière se soulève au gros freinage puis pompe à la remise des gaz..."
        >${escHTML(c.comment)}</textarea>

      </div>

    </div>
  `;

  [
    'game',
    'bike',
    'track',
    'weather',
    'phase',
    'problem'
  ].forEach(id=>{

    const coachId=
      'coach'+
      id.charAt(0).toUpperCase()+
      id.slice(1);

    $(coachId).addEventListener(
      'change',
      ()=>{

        $(id).value=$(coachId).value;

        renderContext();

      }
    );

  });

  $('coachComment').addEventListener(
    'input',
    ()=>{
      $('comment').value=
        $('coachComment').value;
    }
  );
}


// ======================================================
// SAISIE MANUELLE
// ======================================================

const MANUAL_GROUPS=[

  [
    'Pneumatiques',

    [
      [
        'frontTyre',
        'Pneu avant',
        ['Soft','Medium','Hard','Wet']
      ],

      [
        'rearTyre',
        'Pneu arrière',
        ['Soft','Medium','Hard','Wet']
      ]
    ]
  ],

  [
    'Suspension Avant',

    [
      ['preloadFront',LABELS.preloadFront],
      ['oilFront',LABELS.oilFront],
      ['springFront',LABELS.springFront],
      ['compFront',LABELS.compFront],
      ['extFront',LABELS.extFront]
    ]
  ],

  [
    'Suspension Arrière',

    [
      ['preloadRear',LABELS.preloadRear],
      ['springRear',LABELS.springRear],
      ['compRear',LABELS.compRear],
      ['extRear',LABELS.extRear],
      ['swingarm',LABELS.swingarm]
    ]
  ],

  [
    'Boîte de Vitesse',

    [
      ['g1',LABELS.g1],
      ['g2',LABELS.g2],
      ['g3',LABELS.g3],
      ['g4',LABELS.g4],
      ['g5',LABELS.g5],
      ['g6',LABELS.g6],
      ['final',LABELS.final],
      ['antiDribble',LABELS.antiDribble]
    ]
  ],

  [
    'Freins & Électronique',

    [
      [
        'frontBrake',
        'Disque avant',
        [
          '320 mm',
          '330 mm',
          '340 mm (standard)',
          '350 mm'
        ]
      ],

      [
        'rearBrake',
        'Disque arrière',
        [
          '190 mm',
          '200 mm',
          '220 mm (standard)'
        ]
      ],

      ['tcs',LABELS.tcs],
      ['aw',LABELS.aw],
      ['ebs',LABELS.ebs]
    ]
  ],

  [
    'Géométrie',

    [
      ['frontRideHeight',LABELS.frontRideHeight],
      ['rearRideHeight',LABELS.rearRideHeight],
      ['trail',LABELS.trail],
      ['offset',LABELS.offset]
    ]
  ]
];


function valueOptions(selected){

  return Array
    .from({length:7},(_,i)=>{

      const v=i+1;

      return `
        <option
          value="${v}"
          ${Number(selected)===v?'selected':''}
        >
          ${v}
        </option>
      `;

    })
    .join('');
}


function manualField(item){

  const [key,label,opts]=item;

  let html='';

  if(Array.isArray(opts)){

    html=`
      <select data-manual="${key}">

        ${opts.map(v=>`

          <option
            value="${escHTML(v)}"
            ${String(state.manualSetup[key])===String(v)
              ?'selected'
              :''}
          >
            ${escHTML(v)}
          </option>

        `).join('')}

      </select>
    `;

  }else{

    html=`
      <select data-manual="${key}">
        ${valueOptions(state.manualSetup[key])}
      </select>
    `;
  }

  return `
    <div class="manual-row">

      <label>
        ${label}
      </label>

      ${html}

    </div>
  `;
}


function renderManualSetup(){

  const el=$('manualSetup');

  if(!el)return;

  el.innerHTML=`

    <div class="manual-groups">

      ${MANUAL_GROUPS.map(
        ([title,rows])=>`

          <div class="manual-group">

            <h3>${title}</h3>

            ${rows
              .map(manualField)
              .join('')
            }

          </div>

        `
      ).join('')}

    </div>

    <div class="manual-note">

      Échelle des réglages numériques :
      1 = minimum, 7 = maximum.

      Les valeurs pneus/freins sont conservées
      avec le setup publié.

    </div>
  `;

  el
    .querySelectorAll('[data-manual]')
    .forEach(sel=>{

      sel.addEventListener(
        'change',
        ()=>{

          const k=sel.dataset.manual;

          state.manualSetup[k]=
            [
              'frontTyre',
              'rearTyre',
              'frontBrake',
              'rearBrake'
            ].includes(k)
              ? sel.value
              : Number(sel.value);

          persistState();

        }
      );

    });
}


// ======================================================
// PUBLICATION
// ======================================================

function publishSetup(
  setup,
  source='saisie',
  contextOverride=null
){

  const c=
    contextOverride||
    ctx();

  const complete={
    ...base(),
    ...setup
  };

  state.published.unshift({

    id:Date.now(),

    author:'Jérémy #83',

    date:new Date()
      .toLocaleString('fr-FR'),

    context:c,

    setup:complete,

    rating:5,

    source

  });

  persistState();

  renderPublished();

  renderStats();

  showPage('setups');
}


function publishManualSetup(){

  publishSetup(
    state.manualSetup,
    'saisie manuelle'
  );

}


// ======================================================
// MODIFICATION
// ======================================================

function apply(
  s,
  key,
  d,
  reason,
  changes
){

  let before=s[key];

  s[key]=clamp(
    before+d
  );

  if(s[key]!==before){

    changes.push({
      key,
      before,
      after:s[key],
      reason
    });

  }
}


// ======================================================
// EMPREINTE
// ======================================================

function fingerprint(s){

  return SETUP_KEYS
    .map(k=>s[k])
    .join('-');

}


// ======================================================
// BIAIS CIRCUITS
// ======================================================

function trackBias(c,s){

  const t=
    c.track.toLowerCase();

  const w=
    c.weather.toLowerCase();

  if(t.includes('sepang')){
    s.compRear=clamp(s.compRear+1);
    s.extRear=clamp(s.extRear+1);
  }

  if(t.includes('portim')){
    s.compFront=clamp(s.compFront+1);
    s.extFront=clamp(s.extFront+1);
    s.trail=clamp(s.trail-1);
  }

  if(t.includes('valence')){
    s.trail=clamp(s.trail-1);
    s.offset=clamp(s.offset-1);
    s.swingarm=clamp(s.swingarm-1);
  }

  if(t.includes('mandalika')){
    s.swingarm=clamp(s.swingarm+1);
    s.compRear=clamp(s.compRear+1);
  }

  if(t.includes('buriram')){
    s.compRear=clamp(s.compRear+1);
    s.tcs=clamp(s.tcs+1);
  }

  if(t.includes('goiânia')){
    s.compRear=clamp(s.compRear+1);
    s.trail=clamp(s.trail-1);
  }

  if(t.includes('austin')){
    s.compFront=clamp(s.compFront+1);
    s.trail=clamp(s.trail-1);
  }

  if(t.includes('jerez')){
    s.extFront=clamp(s.extFront+1);
    s.trail=clamp(s.trail-1);
  }

  if(t.includes('barcelona')){
    s.extRear=clamp(s.extRear+1);
    s.tcs=clamp(s.tcs+1);
  }

  if(t.includes('mugello')){
    s.trail=clamp(s.trail-1);
    s.extFront=clamp(s.extFront+1);
  }

  if(t.includes('balaton')){
    s.compRear=clamp(s.compRear+1);
    s.swingarm=clamp(s.swingarm+1);
  }

  if(t.includes('brno')){
    s.extFront=clamp(s.extFront+1);
    s.trail=clamp(s.trail-1);
  }

  if(t.includes('assen')){
    s.trail=clamp(s.trail-1);
    s.offset=clamp(s.offset-1);
  }

  if(t.includes('sachsenring')){
    s.trail=clamp(s.trail-1);
    s.extFront=clamp(s.extFront+1);
  }

  if(t.includes('silverstone')){
    s.extFront=clamp(s.extFront+1);
    s.compRear=clamp(s.compRear+1);
  }

  if(t.includes('aragon')){
    s.compFront=clamp(s.compFront+1);
    s.extRear=clamp(s.extRear+1);
  }

  if(t.includes('misano')){
    s.trail=clamp(s.trail-1);
    s.compRear=clamp(s.compRear+1);
  }

  if(t.includes('spielberg')){
    s.compRear=clamp(s.compRear+1);
    s.tcs=clamp(s.tcs+1);
  }

  if(t.includes('motegi')){
    s.compFront=clamp(s.compFront+1);
    s.ebs=clamp(s.ebs-1);
  }

  if(t.includes('phillip island')){
    s.extRear=clamp(s.extRear+1);
    s.trail=clamp(s.trail-1);
  }

  if(t.includes('lusail')){
    s.compRear=clamp(s.compRear+1);
    s.extFront=clamp(s.extFront+1);
  }

  if(w.includes('pluie')){

    s.compRear=clamp(s.compRear+1);
    s.extRear=clamp(s.extRear+1);

    s.tcs=clamp(s.tcs+1);
    s.aw=clamp(s.aw+1);
    s.ebs=clamp(s.ebs-1);

  }
}


// ======================================================
// DIAGNOSTIC
// ======================================================

function diagnose(startSetup=null){

  const c=ctx();

  const changes=[];

  const s={
    ...base(),
    ...(startSetup||{})
  };

  let main='';
  let objective='';


  if(c.problem==='rear_lift'){

    main=
      `Transfert de charge trop brutal vers l'avant au freinage : l'arrière manque de maintien et le frein moteur participe trop au délestage.`;

    objective=
      `Garder la roue arrière au sol au freinage sans rendre la moto lente à inscrire.`;

    apply(
      s,
      'swingarm',
      1,
      'Augmenter le maintien du train arrière',
      changes
    );

    apply(
      s,
      'extRear',
      1,
      'Contrôler le retour du mono',
      changes
    );

    apply(
      s,
      'compRear',
      1,
      'Soutenir le châssis au freinage',
      changes
    );

    apply(
      s,
      'ebs',
      -1,
      'Réduire le frein moteur',
      changes
    );

    apply(
      s,
      'preloadFront',
      -1,
      'Limiter le transfert vers l’avant',
      changes
    );

    apply(
      s,
      'springFront',
      -1,
      'Conserver du grip avant',
      changes
    );

  }

  else if(c.problem==='rear_move'){

    main=
      `L'arrière manque de stabilité : les mouvements proviennent principalement d'un manque de contrôle hydraulique et de soutien du train arrière.`;

    objective=
      `Stabiliser l'arrière sans supprimer le grip mécanique.`;

    apply(s,'compRear',1,'Plus de soutien du mono',changes);
    apply(s,'extRear',1,'Contrôler les oscillations',changes);
    apply(s,'swingarm',1,'Augmenter la stabilité',changes);

  }

  else if(c.problem==='understeer'){

    main=
      `La moto pousse vers l'extérieur : le train avant manque de rotation et/ou la géométrie est trop stable.`;

    objective=
      `Faire tourner la moto plus facilement sans perdre le contrôle au freinage.`;

    apply(s,'trail',-1,'Réduire la stabilité directionnelle',changes);
    apply(s,'offset',-1,'Rendre la direction plus vive',changes);
    apply(s,'extFront',-1,'Libérer le train avant',changes);

  }

  else if(c.problem==='oversteer'){

    main=
      `La moto survire : le train arrière dépasse la capacité de contrôle du pneu et réagit trop vivement aux transferts de charge.`;

    objective=
      `Calmer l'arrière et conserver une remise des gaz progressive.`;

    apply(s,'compRear',-1,'Laisser travailler le pneu',changes);
    apply(s,'extRear',1,'Contrôler le mouvement du mono',changes);
    apply(s,'swingarm',1,'Stabiliser le train arrière',changes);
    apply(s,'tcs',1,'Limiter le patinage',changes);

  }

  else if(c.problem==='poor_turn'){

    main=
      `La moto manque de rotation : l'avant reste trop verrouillé et la géométrie ne favorise pas assez l'inscription.`;

    objective=
      `Gagner de la rotation sans sacrifier le freinage.`;

    apply(s,'trail',-1,'Plus de vivacité',changes);
    apply(s,'offset',-1,'Direction plus réactive',changes);
    apply(s,'extFront',-1,'Avant plus libre',changes);

  }

  else if(c.problem==='poor_exit'){

    main=
      `La remise des gaz manque de grip ou de contrôle du transfert vers l'arrière.`;

    objective=
      `Obtenir une motricité progressive et exploitable à pleine ouverture.`;

    apply(s,'compRear',-1,'Laisser travailler le pneu arrière',changes);
    apply(s,'extRear',1,'Contrôler le transfert',changes);
    apply(s,'tcs',1,'Sécuriser la remise des gaz',changes);
    apply(s,'swingarm',1,'Stabilité de la motricité',changes);

  }

  else if(c.problem==='wheelie'){

    main=
      `L'accélération déleste trop l'avant : la puissance dépasse la capacité de contrôle du train avant.`;

    objective=
      `Conserver l'accélération sans lever excessivement l'avant.`;

    apply(s,'aw',1,'Anti-wheelie plus présent',changes);
    apply(s,'swingarm',1,'Stabilité à l'accélération',changes);
    apply(s,'tcs',1,'Gestion de la remise des gaz',changes);

  }

  else if(c.problem==='brake_lock'){

    main=
      `Le frein moteur et le transfert de charge rendent le pneu arrière trop léger en entrée.`;

    objective=
      `Stabiliser l'arrière et conserver une décélération progressive.`;

    apply(s,'ebs',-1,'Réduire le frein moteur',changes);
    apply(s,'antiDribble',1,'Limiter les réactions de transmission',changes);
    apply(s,'extRear',1,'Contrôler le délestage',changes);

  }

  else{

    main=
      `La moto réagit trop aux irrégularités : l'amortissement et le soutien doivent être rendus plus progressifs.`;

    objective=
      `Conserver le grip mécanique sur les bosses sans perdre la précision.`;

    apply(s,'compFront',-1,'Avant plus compliant',changes);
    apply(s,'extFront',-1,'Retour plus progressif',changes);
    apply(s,'compRear',-1,'Arrière plus absorbant',changes);
    apply(s,'extRear',-1,'Retour plus doux',changes);

  }


  trackBias(c,s);


  const parsed=
    c.comment.toLowerCase();


  if(
    parsed.includes('pompe')||
    parsed.includes('oscille')
  ){

    apply(
      s,
      'compRear',
      1,
      'Commentaire pilote : arrière qui pompe',
      changes
    );

    apply(
      s,
      'extRear',
      1,
      'Commentaire pilote : oscillation',
      changes
    );

  }


  if(
    parsed.includes('élarg')||
    parsed.includes('sous-vire')
  ){

    apply(
      s,
      'trail',
      -1,
      'Commentaire pilote : élargissement',
      changes
    );

    apply(
      s,
      'extFront',
      -1,
      'Commentaire pilote : avant qui pousse',
      changes
    );

  }


  if(parsed.includes('patine')){

    apply(
      s,
      'tcs',
      1,
      'Commentaire pilote : patinage',
      changes
    );

  }


  return{
    context:c,
    setup:s,
    main,
    objective,
    changes
  };
}


// ======================================================
// ANTI-RÉPÉTITION
// ======================================================

function ensureDifferent(s){

  let fp=
    fingerprint(s);

  if(state.fingerprints.includes(fp)){

    let candidates=[
      'swingarm',
      'trail',
      'compRear',
      'extRear',
      'tcs',
      'ebs',
      'compFront',
      'extFront',
      'offset'
    ];

    for(let k of candidates){

      let old=s[k];

      for(let d of [-1,1]){

        s[k]=clamp(old+d);

        if(
          !state.fingerprints.includes(
            fingerprint(s)
          )
        ){

          return;

        }
      }
    }
  }
}


// ======================================================
// AFFICHAGE SETUP
// ======================================================

function setupHTML(s){

  const groups=[

    [
      'Pneumatiques',

      [
        ['Pneu avant',s.frontTyre||'Medium'],
        ['Pneu arrière',s.rearTyre||'Soft']
      ]
    ],

    [
      'Suspension Avant',

      SETUP_KEYS
        .slice(0,5)
        .map(k=>[
          LABELS[k],
          s[k]
        ])
    ],

    [
      'Suspension Arrière',

      SETUP_KEYS
        .slice(5,10)
        .map(k=>[
          LABELS[k],
          s[k]
        ])
    ],

    [
      'Boîte de Vitesse',

      SETUP_KEYS
        .slice(10,17)
        .map(k=>[
          LABELS[k],
          s[k]
        ])
        .concat([
          [
            LABELS.antiDribble,
            s.antiDribble
          ]
        ])
    ],

    [
      'Freins & Électronique',

      [
        [
          'Disque avant',
          s.frontBrake||'340 mm (standard)'
        ],

        [
          'Disque arrière',
          s.rearBrake||'220 mm (standard)'
        ],

        [
          LABELS.tcs,
          s.tcs
        ],

        [
          LABELS.aw,
          s.aw
        ],

        [
          LABELS.ebs,
          s.ebs
        ]
      ]
    ],

    [
      'Géométrie',

      SETUP_KEYS
        .slice(21,25)
        .map(k=>[
          LABELS[k],
          s[k]
        ])
    ]
  ];


  return `

    <div class="result-grid">

      ${groups.map(
        ([title,rows])=>`

          <div class="setup-block
            ${title.includes('Arrière')
              ?'rear'
              :''}">

            <h3>${title}</h3>

            ${rows.map(
              ([l,v])=>`

                <div class="value-row
                  ${l.includes('Bras oscillant')
                    ?'highlight'
                    :''}">

                  <span>${l}</span>

                  <span class="value">
                    ${v}
                  </span>

                </div>

              `
            ).join('')}

          </div>

        `
      ).join('')}

    </div>
  `;
}


// ======================================================
// DIAGNOSTIC AFFICHAGE
// ======================================================

function renderDiagnostic(d){

  $('diagnosticCard').innerHTML=`

    <div class="diag-head">
      ⚙ DIAGNOSTIC MÉCANIQUE
    </div>

    <div
      class="warning"
      style="margin-top:10px">

      ⚠ Problème principal

    </div>

    <p>
      ${d.main}
    </p>

    <div class="diag-box">

      <div class="warning">
        🔧 Ajustements recommandés
      </div>

      ${d.changes.map(
        x=>`

          <div class="change">

            <span>

              ${LABELS[x.key]}

              <small class="muted">
                (${x.reason})
              </small>

            </span>

            <span
              class="${x.after>x.before
                ?'up'
                :'down'}">

              ${x.after>x.before
                ?'+'
                :'-'}${Math.abs(
                  x.after-x.before
                )}

            </span>

          </div>

        `
      ).join('')}

    </div>

    <div class="diag-box">

      <div class="warning">
        🎯 Objectif
      </div>

      <p>
        ${d.objective}
      </p>

    </div>
  `;
}


// ======================================================
// GÉNÉRATION
// ======================================================

function generate(){

  let d=
    diagnose(
      state.manualSetup
    );

  let s={
    ...d.setup
  };

  ensureDifferent(s);

  let fp=
    fingerprint(s);

  state.generated={

    setup:s,

    context:d.context,

    diagnostic:d

  };

  state.fingerprints.push(fp);

  state.versions++;

  state.history.push({

    date:new Date()
      .toLocaleString('fr-FR'),

    type:'génération',

    problem:d.context.problem,

    changes:d.changes.map(
      x=>
        `${LABELS[x.key]} ${x.before}→${x.after}`
    )

  });

  save();

  renderDiagnostic(d);

  renderExpert();

  $('sessionBox')
    .style.display='block';

  $('expertResult')
    .scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
}


// ======================================================
// SETUP EXPERT
// ======================================================

function renderExpert(){

  if(!state.generated){

    $('expertResult').innerHTML=
      '<div class="empty">Aucun setup calculé pour le moment.</div>';

    return;
  }

  let g=
    state.generated.setup;

  let c=
    state.generated.context;

  let why=
    state.generated.diagnostic.changes
      .slice(0,7);

  $('expertResult').innerHTML=`

    <h2>
      🧠 SETUP EXPERT GÉNÉRÉ
    </h2>

    <p class="muted">

      ${c.track}
      ·
      ${c.weather}
      ·
      ${c.bike}

    </p>

    ${setupHTML(g)}

    <div class="reason">

      <b>
        💡 Pourquoi ces réglages ?
      </b>

      <ul>

        ${why.map(
          x=>`

            <li>

              ${LABELS[x.key]} :

              ${x.reason}

              (${x.before} →
              ${x.after})

            </li>

          `
        ).join('')}

      </ul>

    </div>

    <div
      style="
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:12px
      ">

      <button
        class="btn green"
        id="publishBtn">

        👍 Valider / Publier ce setup

      </button>

      <button
        class="btn secondary"
        id="newVersionBtn">

        ↻ Refuser et demander une autre version

      </button>

    </div>
  `;

  $('publishBtn')
    .onclick=publishGenerated;

  $('newVersionBtn')
    .onclick=()=>{
      generate();
    };
}


function publishGenerated(){

  if(!state.generated)
    return;

  publishSetup(
    state.generated.setup,
    'Coach IA',
    state.generated.context
  );
}


// ======================================================
// SETUPS PUBLIÉS
// ======================================================

function renderPublished(){

  let a=
    state.published;

  if(!a.length){

    $('publishedList').innerHTML=
      '<div class="empty">Aucun setup publié.</div>';

    return;
  }

  $('publishedList').innerHTML=

    a.map(
      p=>`

        <div class="card setup-card">

          <div class="pill">
            ${p.context.bike}
          </div>

          <h3>
            ${p.context.track}
          </h3>

          <p class="muted">

            ${p.context.weather}
            ·
            ${p.context.phase}
            ·
            ${p.date}

          </p>

          <div class="badge">

            ✓ Setup complet ·
            bras oscillant inclus

          </div>

          <div style="margin-top:10px">

            ${setupHTML(p.setup)
              .replace(
                'result-grid',
                'published-grid'
              )}

          </div>

        </div>

      `
    ).join('');
}


// ======================================================
// HISTORIQUE
// ======================================================

function renderHistory(){

  let h=
    state.history
      .slice()
      .reverse();

  $('history').innerHTML=

    h.length

    ?

    h.map(
      x=>`

        <div class="history-item">

          <b>
            ${x.type}
          </b>

          ·
          ${x.date}

          <br>

          <span class="muted">
            ${x.problem||''}
          </span>

          <br>

          <small>
            ${(x.changes||[]).join(' · ')}
          </small>

        </div>

      `
    ).join('')

    :

    '<div class="empty">Aucun run enregistré.</div>';
}


// ======================================================
// STATS
// ======================================================

function renderStats(){

  $('statSetups').textContent=
    state.published.length;

  $('statRuns').textContent=
    state.history.length;

  $('statVersions').textContent=
    state.versions;
}


// ======================================================
// RENDU
// ======================================================

function renderAll(){

  renderContext();

  renderManualSetup();

  renderPublished();

  renderHistory();

  renderStats();

  if(state.generated){

    renderExpert();

    renderDiagnostic(
      state.generated.diagnostic
    );

  }
}


// ======================================================
// NAVIGATION
// ======================================================

function showPage(id){

  document
    .querySelectorAll('.section')
    .forEach(
      s=>
        s.classList.toggle(
          'active',
          s.id===id
        )
    );

  document
    .querySelectorAll('.tabs button')
    .forEach(
      b=>
        b.classList.toggle(
          'active',
          b.dataset.page===id
        )
    );

  if(id==='coach')
    renderAll();
}


// ======================================================
// ÉVÉNEMENTS
// ======================================================

document
  .querySelectorAll('.tabs button')
  .forEach(
    b=>
      b.onclick=()=>
        showPage(
          b.dataset.page
        )
  );


$('goCoach').onclick=()=>
  showPage('coach');


[
  'game',
  'bike',
  'track',
  'weather',
  'phase',
  'problem'
].forEach(
  id=>
    $(id).addEventListener(
      'change',
      renderContext
    )
);


$('comment').addEventListener(
  'input',
  renderContext
);


$('diagnoseBtn').onclick=()=>{

  let d=
    diagnose(
      state.manualSetup
    );

  renderDiagnostic(d);

};


$('generateBtn').onclick=
  generate;


$('publishManualBtn').onclick=
  publishManualSetup;


$('resetManualBtn').onclick=()=>{

  state.manualSetup=
    base();

  persistState();

  renderManualSetup();

};


$('useGeneratedBtn').onclick=()=>{

  if(!state.generated){

    alert(
      'Aucun setup Coach IA à reprendre.'
    );

    return;

  }

  state.manualSetup={
    ...base(),
    ...state.generated.setup
  };

  persistState();

  renderManualSetup();

};


// ======================================================
// ÉVOLUTION APRÈS UN RUN
// ======================================================

$('nextRunBtn').onclick=()=>{

  if(!state.generated)
    return;

  let s={
    ...state.generated.setup
  };

  let changes=[];

  const f=[

    [
      'fbEntry',
      'compFront',
      'extFront',
      'ebs'
    ],

    [
      'fbMid',
      'trail',
      'extRear',
      'swingarm'
    ],

    [
      'fbExit',
      'compRear',
      'extRear',
      'tcs'
    ],

    [
      'fbStability',
      'swingarm',
      'compRear',
      'extRear'
    ]

  ];

  f.forEach(
    ([id,a,b,c])=>{

      let v=
        $(id).value;

      if(v==='worse'){

        apply(
          s,
          a,
          1,
          'Retour pilote : pire',
          changes
        );

        apply(
          s,
          b,
          1,
          'Retour pilote : pire',
          changes
        );

        apply(
          s,
          c,
          1,
          'Retour pilote : pire',
          changes
        );

      }

      if(v==='better'){

        apply(
          s,
          a,
          -1,
          'Retour pilote : mieux',
          changes
        );

      }

    }
  );


  let txt=
    $('runComment')
      .value
      .toLowerCase();


  if(txt.includes('pompe')){

    apply(
      s,
      'compRear',
      1,
      'Retour texte : pompe',
      changes
    );

    apply(
      s,
      'extRear',
      1,
      'Retour texte : pompe',
      changes
    );

  }


  if(txt.includes('patine')){

    apply(
      s,
      'tcs',
      1,
      'Retour texte : patinage',
      changes
    );

  }


  if(txt.includes('élarg')){

    apply(
      s,
      'trail',
      -1,
      'Retour texte : élargissement',
      changes
    );

  }


  ensureDifferent(s);

  state.generated.setup=s;

  state.fingerprints.push(
    fingerprint(s)
  );

  state.versions++;

  state.history.push({

    date:new Date()
      .toLocaleString('fr-FR'),

    type:
      'évolution V'+
      state.versions,

    problem:
      state.generated
        .context
        .problem,

    changes:
      changes.map(
        x=>
          `${LABELS[x.key]} ${x.before}→${x.after}`
      )

  });

  save();

  $('runComment').value='';

  renderExpert();

  $('expertResult')
    .scrollIntoView({
      behavior:'smooth'
    });

};


// ======================================================
// INITIALISATION
// ======================================================

renderAll();