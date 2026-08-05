import { describe, expect, it } from "vitest";
import { ASSUMPTIONS } from "../config/assumptions";
import { FUNDING_PROGRAMS } from "../data/fundingPrograms";
import { matchFundingPrograms, type MatchableFarm } from "./matchFundingPrograms";

function fixture(overrides: Partial<MatchableFarm> = {}): MatchableFarm {
  return {
    province: "SK",
    nAppliedKg: 55000,
    coverCropSignal: "not_detected",
    hasLivestock: false,
    totalEmissions: 654,
    detail: {
      directN2O: 484.7,
      indirectN2O: 19.7,
      fields: Array.from({ length: 12 }, () => ({ areaHa: 64 })),
    },
    ...overrides,
  };
}

describe("matchFundingPrograms", () => {
  it("matches an SK farm with N and livestock to SWEAP with three categories", () => {
    const matches = matchFundingPrograms(fixture({ hasLivestock: true }), FUNDING_PROGRAMS, ASSUMPTIONS);
    expect(matches.every((m) => m.programId === "ofcaf-sk-sweap")).toBe(true);
    expect(matches.map((m) => m.category).sort()).toEqual([
      "cover_cropping",
      "nitrogen_management",
      "rotational_grazing",
    ]);
  });

  it("matches an ON farm without cover crop signal to OSCIA cover cropping as likely", () => {
    const matches = matchFundingPrograms(
      fixture({ province: "ON", coverCropSignal: "not_detected" }),
      FUNDING_PROGRAMS,
      ASSUMPTIONS
    );
    const cover = matches.find((m) => m.category === "cover_cropping");
    expect(cover?.programId).toBe("ofcaf-on-oscia");
    expect(cover?.strength).toBe("likely");
  });

  it("marks detected cover cropping as partial with the new-acres reason", () => {
    const matches = matchFundingPrograms(
      fixture({ province: "ON", coverCropSignal: "detected" }),
      FUNDING_PROGRAMS,
      ASSUMPTIONS
    );
    const cover = matches.find((m) => m.category === "cover_cropping");
    expect(cover?.strength).toBe("partial");
    expect(cover?.reasons[0]).toContain("new acres or a new practice");
  });

  it("routes a province without a detailed row to the generic federal row only", () => {
    const matches = matchFundingPrograms(fixture({ province: "NS" }), FUNDING_PROGRAMS, ASSUMPTIONS);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.programId === "ofcaf-federal-generic")).toBe(true);
  });

  it("produces no nitrogen match when nAppliedKg is zero", () => {
    const matches = matchFundingPrograms(fixture({ nAppliedKg: 0 }), FUNDING_PROGRAMS, ASSUMPTIONS);
    expect(matches.some((m) => m.category === "nitrogen_management")).toBe(false);
  });

  it("interpolates real farm numbers into reason strings", () => {
    const matches = matchFundingPrograms(fixture(), FUNDING_PROGRAMS, ASSUMPTIONS);
    const nitrogen = matches.find((m) => m.category === "nitrogen_management");
    expect(nitrogen?.reasons[0]).toContain("55,000 kg/yr");
    expect(nitrogen?.reasons[0]).toContain("77%");
  });
});
