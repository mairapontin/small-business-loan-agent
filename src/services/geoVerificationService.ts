/**
 * @module: Small Business Loan Agent
 * @file: geoVerificationService.ts
 * @description: Geo-environmental verification engine — CAR/DETER/embargo/legal-reserve checks with point-in-time evidence behind a swappable data-source adapter
 * @author: Maíra Pontin
 * @created: 2026-09-22
 * @updated: 2026-09-28T10:39:26
 * @version: 1.1.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import {
  GeoCheck,
  GeoEvidence,
  GeoRepairEvidence,
  GeoVerificationReport,
  LoanApplicationData,
} from '../types';

/**
 * GeoVerificationAgent — verificação territorial e ambiental do imóvel rural.
 *
 * Filosofia alinhada ao pacote `predictive/`: primeiro o CONTRATO de dados e a
 * checagem reproduzível; a fonte real vem depois. Aqui as "fontes" (CAR, alertas
 * de desmatamento estilo DETER/INPE, lista de embargos IBAMA) são fixtures
 * determinísticos atrás de um adaptador (`GeoDataSource`). Para produção, basta
 * trocar a implementação de `defaultSource` por um cliente que chame as APIs
 * públicas reais — nenhuma checagem ou orquestração precisa mudar.
 *
 * Cada resultado carrega evidência point-in-time: `source`, `source_version` e
 * `available_time` (quando a organização poderia conhecer o fato legitimamente),
 * mais um `reason_code` explicável, como pede o estudo.
 */

// ---------------------------------------------------------------------------
// Contrato da fonte de dados (adaptador)
// ---------------------------------------------------------------------------

export interface PropertyFacts {
  property_id: string;
  measured_area_ha: number; // área georreferenciada no CAR
  car_status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  deforestation_overlap_ha: number; // área do polígono sobreposta a alertas de desmate
  deforestation_detection_date: string | null; // data da detecção (event_time)
  embargoed: boolean; // presente na lista de embargos
  legal_reserve_required_pct: number; // exigível (ex.: bioma Amazônia/MT = 80%)
  legal_reserve_declared_pct: number; // averbado/declarado
}

export interface GeoDataSource {
  /** Fatos do imóvel disponíveis em `availableTime` (snapshot point-in-time). */
  getFacts(propertyId: string, availableTime: string): PropertyFacts | null;
}

// ---------------------------------------------------------------------------
// Fixtures (fontes simuladas)
// ---------------------------------------------------------------------------

const FIXTURES: Record<string, PropertyFacts> = {
  // Propriedade limpa — soja em MT, tudo consistente.
  'CAR-MT-2201': {
    property_id: 'CAR-MT-2201',
    measured_area_ha: 1238,
    car_status: 'ACTIVE',
    deforestation_overlap_ha: 0,
    deforestation_detection_date: null,
    embargoed: false,
    legal_reserve_required_pct: 80,
    legal_reserve_declared_pct: 84,
  },
  // Propriedade problemática — metragem superdeclarada, desmate recente,
  // CAR em análise e reserva legal abaixo do exigível.
  'CAR-MT-9902': {
    property_id: 'CAR-MT-9902',
    measured_area_ha: 1180,
    car_status: 'PENDING',
    deforestation_overlap_ha: 63,
    deforestation_detection_date: '2026-07-14',
    embargoed: false,
    legal_reserve_required_pct: 80,
    legal_reserve_declared_pct: 71,
  },
};

export const fixtureSource: GeoDataSource = {
  getFacts(propertyId, _availableTime) {
    return FIXTURES[propertyId] ?? null;
  },
};

// Fonte padrão. Trocar por um cliente real (SICAR / INPE DETER / IBAMA) aqui.
export const defaultSource: GeoDataSource = fixtureSource;

// ---------------------------------------------------------------------------
// Parâmetros de política (PENDING_POLICY no estudo; aqui valores de demo)
// ---------------------------------------------------------------------------

const AREA_PASS_TOLERANCE = 0.02; // <= 2%: coerente
const AREA_REVIEW_TOLERANCE = 0.1; // <= 10%: revisão; acima: bloqueio
const DEFORESTATION_RECENT_DAYS = 180; // alerta recente demais p/ ignorar

const SOURCE_VERSION = 'v3.0-fixture';

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

function evidence(
  source: string,
  availableTime: string,
  detail: string
): GeoEvidence {
  return { source, source_version: SOURCE_VERSION, available_time: availableTime, detail };
}

// ---------------------------------------------------------------------------
// Motor de checagem
// ---------------------------------------------------------------------------

export function runGeoVerification(
  applicationData: LoanApplicationData,
  decisionTime: string,
  source: GeoDataSource = defaultSource,
  repair?: GeoRepairEvidence
): GeoVerificationReport {
  const property = applicationData.property;

  if (!property) {
    // Sem imóvel rural na garantia/operação: checagem não aplicável.
    return {
      property_id: 'n/a',
      decision_time: decisionTime,
      overall_status: 'CLEARED',
      checks: [],
      risk_flags: [],
      blocking_findings: [],
      notes: 'Nenhum imóvel rural informado; verificação territorial não aplicável a esta operação.',
    };
  }

  const facts = source.getFacts(property.property_id, decisionTime);

  if (!facts) {
    return {
      property_id: property.property_id,
      decision_time: decisionTime,
      overall_status: 'REVIEW',
      checks: [
        {
          id: 'source_lookup',
          label: 'Resolução da fonte CAR',
          status: 'REVIEW',
          finding: `Imóvel ${property.property_id} não encontrado na fonte de dados; exige diligência manual.`,
          reason_code: 'PENDING_DATA',
          evidence: evidence('CAR', decisionTime, 'chave inexistente no snapshot'),
        },
      ],
      risk_flags: ['Imóvel sem registro na fonte CAR consultada'],
      blocking_findings: [],
      notes: 'Ausência de dado não é prova de regularidade; caso vai para revisão.',
    };
  }

  const checks: GeoCheck[] = [];

  // 1) Consistência de metragem: declarada vs. georreferenciada no CAR.
  const effectiveDeclared =
    repair?.survey_confirmed_area_ha ?? property.declared_area_ha;
  const areaDiffRatio =
    facts.measured_area_ha > 0
      ? Math.abs(effectiveDeclared - facts.measured_area_ha) / facts.measured_area_ha
      : 1;
  let areaStatus: GeoCheck['status'] = 'PASS';
  let areaReason = 'AREA_CONSISTENT';
  if (areaDiffRatio > AREA_REVIEW_TOLERANCE) {
    areaStatus = 'BLOCK';
    areaReason = 'AREA_MISMATCH';
  } else if (areaDiffRatio > AREA_PASS_TOLERANCE) {
    areaStatus = 'REVIEW';
    areaReason = 'AREA_REVIEW';
  }
  checks.push({
    id: 'area_consistency',
    label: 'Verificação de metragem do imóvel',
    status: areaStatus,
    finding:
      areaStatus === 'PASS'
        ? `Metragem declarada (${effectiveDeclared} ha) coerente com o CAR (${facts.measured_area_ha} ha), desvio de ${(areaDiffRatio * 100).toFixed(1)}%.`
        : `Metragem declarada (${effectiveDeclared} ha) diverge do georreferenciado no CAR (${facts.measured_area_ha} ha) em ${(areaDiffRatio * 100).toFixed(1)}%.`,
    reason_code: areaReason,
    evidence: evidence('CAR/SICAR', decisionTime, 'área poligonal georreferenciada'),
  });

  // 2) Situação cadastral do CAR.
  const carStatus: GeoCheck['status'] =
    facts.car_status === 'ACTIVE' ? 'PASS' : facts.car_status === 'PENDING' ? 'REVIEW' : 'BLOCK';
  checks.push({
    id: 'car_status',
    label: 'Situação do Cadastro Ambiental Rural',
    status: carStatus,
    finding: `CAR com status ${facts.car_status}.`,
    reason_code: carStatus === 'PASS' ? 'CAR_ACTIVE' : 'CAR_NOT_ACTIVE',
    evidence: evidence('CAR/SICAR', decisionTime, `status=${facts.car_status}`),
  });

  // 3) Sobreposição com alertas de desmatamento.
  let deforStatus: GeoCheck['status'] = 'PASS';
  let deforReason = 'NO_DEFORESTATION_OVERLAP';
  let deforFinding = 'Sem sobreposição do polígono com alertas de desmatamento na janela analisada.';
  if (facts.deforestation_overlap_ha > 0) {
    const recent =
      facts.deforestation_detection_date &&
      daysBetween(facts.deforestation_detection_date, decisionTime) <= DEFORESTATION_RECENT_DAYS;
    if (repair?.deforestation_exclusion_ref?.trim()) {
      // An operator-supplied laudo is a claim, not a verified fact: it can
      // downgrade an impeditve BLOCK to diligence-level REVIEW, never to PASS.
      deforStatus = 'REVIEW';
      deforReason = 'DEFORESTATION_EXCLUSION_PENDING_REVIEW';
      deforFinding = `Laudo ${repair.deforestation_exclusion_ref} declara o alerta (${facts.deforestation_overlap_ha} ha) fora do polígono;${recent ? ' detecção recente;' : ''} mantém-se em REVIEW até verificação independente da sobreposição.`;
    } else {
      deforStatus = recent ? 'BLOCK' : 'REVIEW';
      deforReason = recent ? 'RECENT_DEFORESTATION_ALERT' : 'DEFORESTATION_ALERT';
      deforFinding = `Polígono sobrepõe ${facts.deforestation_overlap_ha} ha de alerta de desmatamento (detecção em ${facts.deforestation_detection_date}).`;
    }
  }
  checks.push({
    id: 'deforestation',
    label: 'Sobreposição com área de desmatamento',
    status: deforStatus,
    finding: deforFinding,
    reason_code: deforReason,
    evidence: evidence(
      'DETER/INPE',
      facts.deforestation_detection_date ?? decisionTime,
      `overlap_ha=${facts.deforestation_overlap_ha}`
    ),
  });

  // 4) Embargos (regra impeditiva — não se dilui em score).
  let embargoStatus: GeoCheck['status'] = facts.embargoed ? 'BLOCK' : 'PASS';
  let embargoReason = facts.embargoed ? 'ON_EMBARGO_LIST' : 'NOT_EMBARGOED';
  let embargoFinding = facts.embargoed
    ? 'Imóvel consta em lista de embargos (impeditivo).'
    : 'Imóvel não consta em lista de embargos.';
  if (facts.embargoed && repair?.embargo_lift_ref) {
    embargoStatus = 'REVIEW';
    embargoReason = 'EMBARGO_LIFT_EVIDENCE';
    embargoFinding = `Embargo com evidência de suspensão (${repair.embargo_lift_ref}); requer confirmação jurídica.`;
  }
  checks.push({
    id: 'embargo',
    label: 'Checagem de embargos ambientais',
    status: embargoStatus,
    finding: embargoFinding,
    reason_code: embargoReason,
    evidence: evidence('IBAMA-embargo', decisionTime, `embargoed=${facts.embargoed}`),
  });

  // 5) Reserva legal: averbada vs. exigível.
  const required = facts.legal_reserve_required_pct;
  const declared = repair?.legal_reserve_correction_pct ?? facts.legal_reserve_declared_pct;
  const shortfall = required - declared;
  let lrStatus: GeoCheck['status'] = 'PASS';
  let lrReason = 'LEGAL_RESERVE_OK';
  if (shortfall > 5) lrStatus = 'BLOCK';
  else if (shortfall > 0) lrStatus = 'REVIEW';
  if (lrStatus !== 'PASS') lrReason = 'LEGAL_RESERVE_DEFICIT';
  checks.push({
    id: 'legal_reserve',
    label: 'Adequação de reserva legal',
    status: lrStatus,
    finding:
      shortfall <= 0
        ? `Reserva legal declarada (${declared}%) atende o exigível (${required}%).`
        : `Reserva legal declarada (${declared}%) abaixo do exigível (${required}%), déficit de ${shortfall.toFixed(0)} p.p.`,
    reason_code: lrReason,
    evidence: evidence('CAR/SICAR', decisionTime, `declared=${declared}%; required=${required}%`),
  });

  // Consolidação do status geral.
  const blocking = checks.filter((c) => c.status === 'BLOCK');
  const review = checks.filter((c) => c.status === 'REVIEW');
  const overall: GeoVerificationReport['overall_status'] =
    blocking.length > 0 ? 'BLOCKED' : review.length > 0 ? 'REVIEW' : 'CLEARED';

  const riskFlags = [...blocking, ...review].map((c) => c.finding);
  const blockingFindings = blocking.map((c) => c.finding);

  return {
    property_id: property.property_id,
    decision_time: decisionTime,
    overall_status: overall,
    checks,
    risk_flags: riskFlags,
    blocking_findings: blockingFindings,
    notes:
      overall === 'CLEARED'
        ? 'Todas as checagens territoriais e ambientais aprovadas no corte point-in-time.'
        : overall === 'REVIEW'
        ? 'Há achados que pedem diligência; operação pode avançar com sinalização de risco.'
        : 'Há achados impeditivos; workflow pausado para reparo com evidência antes da análise de crédito.',
  };
}

/** Resumo em texto para o chat do orquestrador. */
export function summarizeGeoReport(report: GeoVerificationReport): string {
  if (report.checks.length === 0) return report.notes;
  const lines = report.checks.map(
    (c) => `  - ${c.label}: ${c.status} (${c.reason_code})`
  );
  return `Verificação territorial do imóvel ${report.property_id} — ${report.overall_status}:\n${lines.join('\n')}`;
}
