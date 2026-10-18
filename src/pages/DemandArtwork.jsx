import React from 'react';

/** Deterministic, offline SVG artwork. No stock photography, requests or storage. */
const hash = (value) => {
  let h = 2166136261;
  for (const c of String(value ?? '')) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};
const themes = [
  { bg:'#173D32', hill:'#396D5B', hill2:'#7D9D80', light:'#F4E7CA', ink:'#E8EEDB' },
  { bg:'#E5E9DD', hill:'#B1C8B6', hill2:'#6D9581', light:'#EFC18D', ink:'#284A3B' },
  { bg:'#DCDDD0', hill:'#9AB2A1', hill2:'#557F72', light:'#E4A66D', ink:'#29473D' },
  { bg:'#284B48', hill:'#4D7773', hill2:'#9EB3A0', light:'#E9BD83', ink:'#F6F0E2' },
  { bg:'#E9DFCE', hill:'#C6C8B2', hill2:'#779687', light:'#C88B5C', ink:'#365247' },
  { bg:'#DCE6E3', hill:'#AACBC8', hill2:'#62918E', light:'#E6B580', ink:'#294F50' },
];
function Person({ x, y, color, pole=false, scale=1, bag=false }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
    <circle cx="0" cy="-20" r="4.2" fill={color} stroke="none"/>
    {bag && <rect x="-9" y="-13" width="7" height="13" rx="3" fill={color} stroke="none"/>}
    <path d="M0-15 L2 1 M1-10 L-9-1 M1-9 L11-3 M2 1 L-6 17 M2 1 L12 16"/>
    {pole && <path d="M-9-1 L-12 18" strokeWidth="1.5"/>}
  </g>;
}
export default function DemandArtwork({ demand, className='' }) {
  const r=demand||{};
  const seed=hash(r.id ?? `${r.activity||''}:${r.location_text||''}`);
  const p=themes[seed % themes.length];
  const raw=[r.activity,r.title,r.description,r.notes].filter(Boolean).join(' ').toLocaleLowerCase('sr');
  const category=String(r.intent_type||'').toLowerCase();
  const isStay=category==='accommodation'||/vikendic|brvnar|smeštaj|smestaj|apartman|kućic|kucic/.test(raw);
  const isSki=/skij|ski\b|snowboard|bordov/.test(raw);
  const isWater=/kajak|kanu|rafting|splav|veslan/.test(raw);
  const isBike=/bicikl|bike|mtb|cycling/.test(raw);
  const isCamp=/kamp|šator|sator/.test(raw);
  const isGuide=/vodič|vodic|instruktor|obuk|čas|cas|učitelj|ucitelj/.test(raw);
  const count=Math.max(1,Math.min(9,Number(r.people_count)||1));
  const type=isStay?'stay':isSki?'ski':isWater?'water':isBike?'bike':isCamp?'camp':'hike';
  const group=count>=4?4:count>=2?2:1;
  const code={stay:'STAY',ski:'SNOW',water:'WATER',bike:'RIDE',camp:'CAMP',hike:'TRAIL'}[type];
  const stroke=p.ink;
  const offset=(seed%23)-11;
  const people=Array.from({length:group},(_,i)=>i);
  return <div className={`mo-artwork mo-artwork--${type} ${className}`} role="img" aria-label={`Ilustracija: ${type==='stay'?'smeštaj':type==='ski'?'skijanje':type==='water'?'aktivnost na vodi':type==='bike'?'biciklizam':type==='camp'?'kampovanje':'planinarenje'}, ${count} osoba${isGuide?', sa vodičem ili instruktorom':''}`}>
    <svg viewBox="0 0 520 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="520" height="180" fill={p.bg}/>
      <g fill="none" stroke={p.ink} strokeOpacity=".12" strokeWidth="1.2">
        <path d="M-50 30 Q90 -30 230 30 T550 24 M-40 47 Q100 -13 240 47 T550 41 M-40 64 Q100 4 240 64 T550 58"/>
        <path d="M-40 147 Q110 88 240 147 T550 143 M-40 162 Q110 103 240 162 T550 158"/>
      </g>
      <circle cx={425+offset} cy="42" r="21" fill={p.light} opacity=".88"/>
      {type==='water'?<>
        <path d="M0 95 Q80 66 160 94 T320 92 T520 96 V180 H0Z" fill={p.hill}/>
        <path d="M0 127 Q70 109 150 127 T310 128 T520 126 V180 H0Z" fill={p.hill2}/>
        <path d="M120 120 Q260 158 400 120 L370 140 Q260 162 150 140Z" fill={p.light}/>
        {people.map((i)=><g key={i}><Person x={205+i*39} y={123+(i%2)*4} color={stroke} scale={.9}/><path d={`M${177+i*39} 98 l42 54`} stroke={stroke} strokeWidth="3" strokeLinecap="round"/></g>)}
      </>:<>
        <path d={`M0 122 L${110+offset} 42 L215 114 L${325-offset} 18 L520 123 V180 H0Z`} fill={p.hill}/>
        <path d={`M0 145 L${120-offset} 93 L250 142 L${375+offset} 64 L520 144 V180 H0Z`} fill={p.hill2}/>
        <path d="M0 166 Q120 125 250 157 T520 153 V180 H0Z" fill={p.bg} opacity=".38"/>
        {type==='stay'?<g transform={`translate(${205+offset} 61)`}>
          <path d="M0 48 L62 0 L126 48" fill="none" stroke={stroke} strokeWidth="7" strokeLinejoin="round"/>
          <rect x="12" y="45" width="102" height="75" fill={p.light}/><rect x="49" y="73" width="29" height="47" fill={p.hill}/><rect x="23" y="58" width="18" height="18" fill={p.hill2}/><rect x="88" y="58" width="18" height="18" fill={p.hill2}/>
        </g>:type==='camp'?<g transform="translate(220 85)"><path d="M0 65 L64 -15 L130 65Z" fill={p.light}/><path d="M64 -15 L64 65 L100 65Z" fill={p.hill}/><path d="M47 65 L64 27 L82 65Z" fill={p.bg}/></g>:type==='bike'?<g transform="translate(195 72)" stroke={stroke} strokeWidth="4" fill="none"><circle cx="38" cy="74" r="25"/><circle cx="139" cy="74" r="25"/><path d="M38 74 L80 25 L106 74 L38 74 M106 74 L139 74 L118 27 L99 27 M80 25 L71 19 M114 25 L126 25"/><Person x={89} y={26} color={stroke} scale={.8}/></g>:type==='ski'?<>
          {people.map((i)=><g key={i}><Person x={214+i*39} y={121+(i%2)*6} color={stroke} scale={.94} pole={isGuide&&i===0}/><path d={`M${195+i*39} 143 l48 7`} stroke={stroke} strokeWidth="2.4" strokeLinecap="round"/></g>)}
        </>:<>
          {people.map((i)=><Person key={i} x={219+i*(group===4?32:57)} y={123+(i%2)*8} color={stroke} scale={group===4?.84:1.03} pole={isGuide&&i===0} bag={i%2===0}/>)}
        </>}
      </>}
      <text x="21" y="30" fill={p.ink} opacity=".9" fontFamily="system-ui,sans-serif" fontSize="12" fontWeight="800" letterSpacing="2.3">{code} / {String(seed%997).padStart(3,'0')}</text>
      <path d="M20 40 H88" stroke={p.ink} strokeOpacity=".5"/>
      <g transform="translate(20 150)">
        <rect width={isGuide?146:91} height="23" rx="11.5" fill={p.bg} fillOpacity=".8" stroke={p.ink} strokeOpacity=".23"/>
        <text x="12" y="15.5" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill={p.ink}>{count} {count===1?'OSOBA':'OSOBA'}{isGuide?' · SA VODIČEM':''}</text>
      </g>
    </svg>
  </div>;
}
