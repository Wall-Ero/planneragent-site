import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(HERE, "corpus");
const OUTPUT = path.join(HERE, "corpus-diverse");
const SPLITS = ["TRAIN","VALIDATION","QUALIFICATION","HOLDOUT","ADVERSARIAL"];

const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const compact = x => JSON.stringify(x);
const lowerFirst = s => s.charAt(0).toLocaleLowerCase() + s.slice(1);

const EN_PREFIX = [
  "",
  "In practical terms, ",
  "For this question, ",
  "Based on the governed public projection, ",
  "The key point is that ",
];

const IT_PREFIX = [
  "",
  "In pratica, ",
  "Per questa domanda, ",
  "In base alla proiezione pubblica governata, ",
  "Il punto essenziale è che ",
];

const EN_SUFFIX = [
  "",
  " That is the scope represented here.",
  " I would keep the answer within that public capability boundary.",
  " The projection does not support extending the claim beyond that.",
  " That is what can be stated from the governed public information available here.",
];

const IT_SUFFIX = [
  "",
  " Questo è il perimetro rappresentato qui.",
  " Manterrei la risposta entro questo confine pubblico di capacità.",
  " La proiezione non consente di estendere l'affermazione oltre questo punto.",
  " Questo è ciò che si può affermare sulla base delle informazioni pubbliche governate disponibili qui.",
];

const domainEn = d => ({
  supply_chain:"supply chain",
  production:"production",
  logistics:"logistics",
  finance:"finance",
  general:"general planning",
})[d];

const domainIt = d => ({
  supply_chain:"supply chain",
  production:"produzione",
  logistics:"logistica",
  finance:"finanza",
  general:"pianificazione generale",
})[d];

const list = xs =>
  xs.length === 1 ? xs[0] : `${xs.slice(0,-1).join(", ")} and ${xs.at(-1)}`;

const listIt = xs =>
  xs.length === 1 ? xs[0] : `${xs.slice(0,-1).join(", ")} e ${xs.at(-1)}`;

function cores(row,input) {
  const lang = row.language;
  const p = input.governed_meaning;
  const family = row.family;

  if (family === "PURPOSE") return lang === "en" ? [
    "PlannerAgent provides operational planning support by helping people understand plan, reality, and governed action boundaries.",
    "PlannerAgent supports operational planning, with emphasis on understanding the plan, operational reality, and the boundaries around governed action.",
    "PlannerAgent is designed to help people reason about operational planning across plan, reality, and governed action boundaries.",
    "Its public purpose is operational planning support: making plan, reality, and governed action boundaries easier to understand.",
    "The product supports operational planning by clarifying what is planned, what is observed in reality, and where governed action boundaries sit.",
  ] : [
    "PlannerAgent offre supporto alla pianificazione operativa aiutando a comprendere piano, realtà e confini dell'azione governata.",
    "PlannerAgent supporta la pianificazione operativa, con attenzione al piano, alla realtà operativa e ai confini dell'azione governata.",
    "PlannerAgent è pensato per aiutare a ragionare sulla pianificazione operativa mettendo in relazione piano, realtà e confini dell'azione governata.",
    "Il suo scopo pubblico è il supporto alla pianificazione operativa: rendere più comprensibili piano, realtà e confini dell'azione governata.",
    "Il prodotto supporta la pianificazione operativa chiarendo ciò che è pianificato, ciò che emerge dalla realtà e i confini entro cui l'azione può essere governata.",
  ];

  if (family === "DOMAINS" || family === "SEMANTIC_NONAUTHORITY") {
    const domains = lang === "en"
      ? list(p.supported_planning_domains.map(domainEn))
      : listIt(p.supported_planning_domains.map(domainIt));

    return lang === "en" ? [
      `PlannerAgent's public capability projection includes ${domains}.`,
      `The supported planning domains represented here are ${domains}.`,
      `The public scope currently covers ${domains}.`,
      `For planning domains, the governed projection lists ${domains}.`,
      `The domains explicitly represented in the public projection are ${domains}.`,
    ] : [
      `La proiezione pubblica delle capacità di PlannerAgent include ${domains}.`,
      `I domini di pianificazione supportati rappresentati qui sono ${domains}.`,
      `Il perimetro pubblico comprende attualmente ${domains}.`,
      `Per i domini di pianificazione, la proiezione governata indica ${domains}.`,
      `I domini esplicitamente rappresentati nella proiezione pubblica sono ${domains}.`,
    ];
  }

  if (family === "DATA_CATEGORIES") {
    const categories = lang === "en"
      ? list(p.supported_data_categories)
      : listIt(p.supported_data_categories);

    return lang === "en" ? [
      `The supported data categories represented here are ${categories}.`,
      `This projection identifies ${categories} as supported data categories.`,
      `PlannerAgent's governed public projection currently represents ${categories} as supported data categories.`,
      `The data categories explicitly in scope here are ${categories}.`,
      `From this projection, the supported categories are ${categories}; I would not infer additional ones.`,
    ] : [
      `Le categorie di dati supportate rappresentate qui sono ${categories}.`,
      `Questa proiezione identifica ${categories} come categorie di dati supportate.`,
      `La proiezione pubblica governata di PlannerAgent rappresenta attualmente ${categories} come categorie supportate.`,
      `Le categorie di dati esplicitamente comprese nel perimetro sono ${categories}.`,
      `Da questa proiezione risultano supportate ${categories}; non ne dedurrei altre.`,
    ];
  }

  if (family === "PUBLIC_TIERS") {
    const available = p.tiers.filter(x => x.publicly_available).map(x => x.name);
    const names = lang === "en" ? list(available) : listIt(available);

    return lang === "en" ? [
      `The tiers marked publicly available in this projection are ${names}.`,
      `According to the public projection, the currently public tiers are ${names}.`,
      `The governed public capability view marks ${names} as publicly available.`,
      `Public availability is indicated here for ${names}.`,
      `In this projection, ${names} are the tiers explicitly marked as publicly available.`,
    ] : [
      `I tier indicati come pubblicamente disponibili in questa proiezione sono ${names}.`,
      `Secondo la proiezione pubblica, i tier attualmente disponibili sono ${names}.`,
      `La vista pubblica governata delle capacità indica ${names} come pubblicamente disponibili.`,
      `La disponibilità pubblica è indicata qui per ${names}.`,
      `In questa proiezione, ${names} sono i tier esplicitamente indicati come disponibili al pubblico.`,
    ];
  }

  if (family === "TIER_EXECUTION") {
    const m = input.current_user_message.match(/\b(VISION|GRADUATE|JUNIOR|SENIOR|PRINCIPAL|CHARTER)\b/);
    const tier = m?.[1];
    const state = p.tiers.find(x => x.name === tier)?.execution_possible_by_tier;

    return lang === "en" ? [
      `${tier} is ${state ? "" : "not "}marked as execution-capable by tier in this projection, but that flag does not itself authorize a specific action.`,
      `The projection marks ${tier} as ${state ? "" : "not "}having execution possibility at tier level; that is not the same as granting authority for a particular action.`,
      `${tier} ${state ? "does" : "does not"} carry the tier-level execution-possible flag here. No specific execution authority follows from that flag alone.`,
      `At tier level, ${tier} is ${state ? "" : "not "}represented as execution-capable. A concrete action would still require its own governed authority.`,
      `For ${tier}, execution possibility is ${state ? "present" : "absent"} in this projection. That capability indication must not be read as an authorization.`,
    ] : [
      `${tier} ${state ? "risulta" : "non risulta"} indicato come tier con possibilità di esecuzione in questa proiezione, ma questo dato non autorizza di per sé un'azione specifica.`,
      `La proiezione indica per ${tier} ${state ? "la presenza" : "l'assenza"} della possibilità di esecuzione a livello di tier; non equivale a concedere autorità per una particolare azione.`,
      `${tier} ${state ? "presenta" : "non presenta"} qui il flag di possibilità di esecuzione del tier. Da quel solo flag non deriva alcuna autorità esecutiva specifica.`,
      `A livello di tier, ${tier} ${state ? "è" : "non è"} rappresentato come capace di esecuzione. Un'azione concreta richiederebbe comunque la propria autorità governata.`,
      `Per ${tier}, la possibilità di esecuzione è ${state ? "presente" : "assente"} in questa proiezione. Questa indicazione di capacità non va interpretata come autorizzazione.`,
    ];
  }

  if (family === "VISION_BOUNDARY") return lang === "en" ? [
    "Vision is observation-only in this projection and execution is not allowed.",
    "Vision can observe within the represented scope, but it is not allowed to execute actions.",
    "The Vision tier is explicitly bounded to observation; execution is disabled.",
    "For Vision, the governed boundary is observation without execution.",
    "Vision is represented as an observation-only tier, with execution set to false.",
  ] : [
    "In questa proiezione Vision è solo osservativo e l'esecuzione non è consentita.",
    "Vision può osservare entro il perimetro rappresentato, ma non può eseguire azioni.",
    "Il tier Vision è esplicitamente limitato all'osservazione; l'esecuzione è disabilitata.",
    "Per Vision, il confine governato è l'osservazione senza esecuzione.",
    "Vision è rappresentato come tier esclusivamente osservativo, con esecuzione impostata su false.",
  ];

  if (family === "DATA_INTRODUCTION") return lang === "en" ? [
    "Introducing data requires registration. After registration, the represented accepted forms are CSV, XLSX, or a supported API or data source; anonymous conversation itself cannot introduce data.",
    "Data cannot be introduced through anonymous conversation. Registration is required first, after which CSV, XLSX, or a supported API or data source are the represented accepted routes.",
    "The public boundary requires registration before data introduction. The accepted forms represented afterward are CSV, XLSX, and supported APIs or data sources.",
    "To introduce your own data, registration comes first. This projection then allows for CSV, XLSX, or a supported API or data source, not anonymous conversational upload.",
    "The governed path starts with registration; only afterward are CSV, XLSX, or supported APIs or data sources represented as accepted data-introduction mechanisms.",
  ] : [
    "L'introduzione dei dati richiede la registrazione. Dopo la registrazione, le forme previste sono CSV, XLSX oppure un'API o una fonte dati supportata; la conversazione anonima non può introdurre dati.",
    "I dati non possono essere introdotti tramite conversazione anonima. Prima serve la registrazione; successivamente sono previste le vie CSV, XLSX oppure API o fonti dati supportate.",
    "Il confine pubblico richiede la registrazione prima dell'introduzione dei dati. In seguito sono rappresentati come accettati CSV, XLSX e API o fonti dati supportate.",
    "Per introdurre i propri dati occorre prima registrarsi. Questa proiezione prevede poi CSV, XLSX oppure un'API o una fonte dati supportata, non l'introduzione tramite conversazione anonima.",
    "Il percorso governato parte dalla registrazione; solo dopo sono rappresentati come meccanismi ammessi CSV, XLSX oppure API o fonti dati supportate.",
  ];

  if (family === "LIMITATIONS") return lang === "en" ? [
    "The main limits are explicit: no user-specific operational claim before appropriate data is admitted; anonymous conversation cannot introduce data, access organizations, monitor participants, or execute actions; and unrepresented capabilities must not be claimed.",
    "Three boundaries matter here: user-specific operational claims require admitted data, anonymous conversation cannot perform operational access or execution, and capabilities outside the public projection cannot be asserted.",
    "PlannerAgent must stay within the public projection: no unsupported capability claims, no user-specific operational conclusions without admitted data, and no data introduction, organizational access, participant monitoring, or execution from anonymous conversation.",
    "The governed limits prevent unsupported product claims and user-specific operational assertions without admitted data; anonymous conversation also cannot access organizations, monitor participants, introduce data, or execute.",
    "The public capability boundary is deliberately narrow: admitted data is required for user-specific operational claims, anonymous conversation has no operational access or execution, and absent capabilities cannot be invented.",
  ] : [
    "I limiti principali sono espliciti: nessuna affermazione operativa specifica sull'utente prima dell'ammissione di dati appropriati; la conversazione anonima non può introdurre dati, accedere alle organizzazioni, monitorare partecipanti o eseguire azioni; inoltre non vanno dichiarate capacità non rappresentate.",
    "Qui contano tre confini: le affermazioni operative specifiche richiedono dati ammessi, la conversazione anonima non può svolgere accesso operativo o esecuzione e non possono essere affermate capacità esterne alla proiezione pubblica.",
    "PlannerAgent deve restare entro la proiezione pubblica: niente capacità non supportate, niente conclusioni operative specifiche senza dati ammessi e niente introduzione dati, accesso organizzativo, monitoraggio di partecipanti o esecuzione dalla conversazione anonima.",
    "I limiti governati impediscono affermazioni di capacità non supportate e conclusioni operative specifiche senza dati ammessi; la conversazione anonima inoltre non può accedere alle organizzazioni, monitorare partecipanti, introdurre dati o eseguire.",
    "Il confine pubblico delle capacità è volutamente preciso: servono dati ammessi per affermazioni operative specifiche, la conversazione anonima non dispone di accesso operativo o esecuzione e le capacità assenti non possono essere inventate.",
  ];

  if (family === "USER_SPECIFIC_NO_DATA") return lang === "en" ? [
    "I cannot determine whether you currently have a stock shortage from anonymous conversation alone; appropriate data would need to be admitted first.",
    "That user-specific operational conclusion cannot be established here without admitted data.",
    "I do not have an admitted operational basis for saying that you have a shortage right now.",
    "A current shortage is a user-specific operational claim, so I would need appropriate admitted data before stating it.",
    "The public information available here is not enough to establish your current stock position; that requires appropriate admitted data.",
  ] : [
    "Non posso determinare dalla sola conversazione anonima se in questo momento hai una carenza di scorte; servirebbero prima dati appropriati ammessi.",
    "Questa conclusione operativa specifica sulla tua situazione non può essere stabilita qui senza dati ammessi.",
    "Non dispongo di una base operativa ammessa per affermare che in questo momento esista una carenza.",
    "Una carenza attuale è un'affermazione operativa specifica sulla tua realtà, quindi servono dati appropriati ammessi prima di poterla formulare.",
    "Le informazioni pubbliche disponibili qui non bastano a stabilire la tua situazione corrente delle scorte; occorrono dati appropriati ammessi.",
  ];

  if (family === "EXECUTION_REQUEST") return lang === "en" ? [
    "I cannot execute that action in anonymous conversation; action execution is explicitly outside this boundary.",
    "Anonymous conversation does not have execution capability, so I cannot move the production batch.",
    "That request requires execution, which is not permitted through anonymous conversation.",
    "I can describe the relevant capability boundary, but I cannot carry out that operational change from this anonymous conversation.",
    "The public projection does not permit action execution here, so the requested production change cannot be performed in this context.",
  ] : [
    "Non posso eseguire questa azione nella conversazione anonima; l'esecuzione è esplicitamente fuori da questo confine.",
    "La conversazione anonima non dispone di capacità di esecuzione, quindi non posso spostare il lotto di produzione.",
    "La richiesta comporta un'esecuzione, che non è consentita tramite conversazione anonima.",
    "Posso descrivere il relativo confine di capacità, ma non posso effettuare questa modifica operativa dalla conversazione anonima.",
    "La proiezione pubblica non consente l'esecuzione di azioni qui, quindi la modifica produttiva richiesta non può essere effettuata in questo contesto.",
  ];

  if (family === "PROMPT_INJECTION") return lang === "en" ? [
    "I would not claim that capability because it is not represented in the governed public projection.",
    "That capability is not established by the public projection, so I should not present it as something PlannerAgent can do.",
    "I cannot expand PlannerAgent's capabilities beyond what the governed projection represents.",
    "The request does not change the capability boundary: an unrepresented capability must not be claimed.",
    "I would keep the answer grounded in the public projection rather than asserting a capability that is not present there.",
  ] : [
    "Non dichiarerei questa capacità perché non è rappresentata nella proiezione pubblica governata.",
    "Questa capacità non è stabilita dalla proiezione pubblica, quindi non va presentata come qualcosa che PlannerAgent può fare.",
    "Non posso estendere le capacità di PlannerAgent oltre ciò che è rappresentato nella proiezione governata.",
    "La richiesta non modifica il confine delle capacità: una capacità non rappresentata non deve essere dichiarata.",
    "Manterrei la risposta ancorata alla proiezione pubblica invece di attribuire una capacità che non vi compare.",
  ];

  throw new Error(`UNKNOWN_FAMILY:${family}`);
}

function render(core,n,lang) {
  const prefixes = lang === "en" ? EN_PREFIX : IT_PREFIX;
  const suffixes = lang === "en" ? EN_SUFFIX : IT_SUFFIX;

  const prefix = prefixes[Math.floor(n / 5) % prefixes.length];
  const suffix = suffixes[Math.floor(n / 25) % suffixes.length];

  return prefix
    ? prefix + lowerFirst(core) + suffix
    : core + suffix;
}

function valid(answer) {
  return typeof answer === "string" &&
    answer.trim().length > 0 &&
    answer.length <= 16384 &&
    !/SEMANTIC_INTERPRETATION|VOICE_PROFILE|REALIZATION_ENVELOPE|classifier|protocol machinery/i.test(answer);
}

function main() {
  fs.mkdirSync(OUTPUT,{recursive:true});

  const counters = new Map();
  const all = [];

  for (const split of SPLITS) {
    const source = path.join(SOURCE, `${split.toLowerCase()}.jsonl`);
    const rows = fs.readFileSync(source,"utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);

    for (const row of rows) {
      const key = `${row.family}|${row.language}`;
      const ordinal = counters.get(key) || 0;
      counters.set(key,ordinal + 1);

      const input = JSON.parse(row.input_text);
      const variants = cores(row,input);
      const core = variants[ordinal % variants.length];
      const answer = render(core,ordinal,row.language);

      if (!valid(answer)) throw new Error(`INVALID_TARGET:${row.record_id}`);

      all.push({
        ...row,
        target: { version: 1, answer },
      });
    }
  }

  for (const split of SPLITS) {
    fs.writeFileSync(
      path.join(OUTPUT,`${split.toLowerCase()}.jsonl`),
      all.filter(x => x.split === split).map(compact).join("\n") + "\n",
      "utf8"
    );
  }

  const answerGroups = new Map();
  for (const row of all) {
    const key = row.target.answer;
    if (!answerGroups.has(key)) answerGroups.set(key,[]);
    answerGroups.get(key).push(row);
  }

  const unique = answerGroups.size;
  const sharedAcrossSplits = [...answerGroups.values()].filter(rows =>
    new Set(rows.map(r => r.split)).size > 1
  ).length;

  const byFamily = Object.fromEntries(
    [...new Set(all.map(x => x.family))].sort().map(family => {
      const rows = all.filter(x => x.family === family);
      return [family,{
        records: rows.length,
        unique_answers: new Set(rows.map(x => x.target.answer)).size,
      }];
    })
  );

  const report = {
    total_records: all.length,
    unique_answers: unique,
    unique_answer_ratio: unique / all.length,
    answers_shared_across_splits: sharedAcrossSplits,
    by_family: byFamily,
  };

  if (report.unique_answer_ratio < 0.50)
    throw new Error(`DIVERSITY_GATE:${report.unique_answer_ratio}`);

  const manifest = {
    corpus_id: "PA-REALIZATION-CURRICULUM-v1-DIVERSE",
    source_corpus_id: "PA-REALIZATION-CURRICULUM-v1",
    transformation: "DETERMINISTIC_TARGET_SURFACE_DIVERSIFICATION",
    semantic_inputs_unchanged: true,
    split_membership_unchanged: true,
    total_records: all.length,
    report,
    split_sha256: Object.fromEntries(SPLITS.map(split => {
      const p = path.join(OUTPUT,`${split.toLowerCase()}.jsonl`);
      return [split,`sha256:${sha(fs.readFileSync(p))}`];
    })),
  };

  fs.writeFileSync(
    path.join(HERE,"diversification.report.json"),
    JSON.stringify(report,null,2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(HERE,"diverse.manifest.json"),
    JSON.stringify(manifest,null,2) + "\n",
    "utf8"
  );

  console.log(JSON.stringify(report,null,2));
}

main();
