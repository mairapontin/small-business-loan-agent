import { Tool, Type } from '@google/genai';

/**
 * Gemini tool declarations for the four pipeline steps the ADK root agent can
 * invoke. Each declaration describes the function signature Gemini sees — the
 * actual execution still runs through the deterministic AgentStep executors in
 * orchestrator.ts. The LLM decides *when* to call them; the executors decide
 * *what* they compute.
 */

export const PIPELINE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'run_document_extraction',
        description:
          'Parse and validate a loan application document. Returns the extracted application data with all critical fields (business_name, owner_name, loan_amount_requested, annual_revenue). Halts if any critical field is missing.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            loan_request_id: {
              type: Type.STRING,
              description: 'The loan request identifier (e.g. SBL-2025-02142)',
            },
          },
          required: ['loan_request_id'],
        },
      },
      {
        name: 'run_geo_verification',
        description:
          'Run geo-environmental verification of the rural property against CAR/DETER/IBAMA datasets. Returns a GeoVerificationReport with overall_status (CLEARED, REVIEW, or BLOCKED), individual checks, risk flags, and blocking findings. Accepts optional repair evidence from a previous blocked run to re-verify.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            loan_request_id: {
              type: Type.STRING,
              description: 'The loan request identifier',
            },
            repair_evidence: {
              type: Type.OBJECT,
              description:
                'Optional operator-supplied evidence to resolve previously blocked findings (survey area, deforestation exclusion ref, embargo lift ref, legal reserve correction)',
              properties: {
                survey_confirmed_area_ha: { type: Type.NUMBER },
                deforestation_exclusion_ref: { type: Type.STRING },
                embargo_lift_ref: { type: Type.STRING },
                legal_reserve_correction_pct: { type: Type.NUMBER },
                reviewer: { type: Type.STRING },
              },
            },
          },
          required: ['loan_request_id'],
        },
      },
      {
        name: 'run_underwriting',
        description:
          'Evaluate credit eligibility based on application data and geo-verification results. Returns an UnderwritingReport with eligibility_status (ELIGIBLE, REVIEW, or INELIGIBLE), matched rule, risk flags, and credit score.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            loan_request_id: {
              type: Type.STRING,
              description: 'The loan request identifier',
            },
          },
          required: ['loan_request_id'],
        },
      },
      {
        name: 'run_pricing',
        description:
          'Calculate loan pricing (interest rate, monthly payment, total interest, risk tier) based on the application and underwriting report. Requires underwriting to be completed first.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            loan_request_id: {
              type: Type.STRING,
              description: 'The loan request identifier',
            },
          },
          required: ['loan_request_id'],
        },
      },
    ],
  },
];
