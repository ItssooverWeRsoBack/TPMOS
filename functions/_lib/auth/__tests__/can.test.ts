import { describe, it, expect } from "vitest";
import { can, type Action } from "../can";

// Test users
const admin = { role: "admin", id: "user-admin" };
const tpm = { role: "tpm", id: "user-tpm" };
const em = { role: "em", id: "user-em" };
const ic = { role: "ic", id: "user-ic" };
const exec = { role: "exec", id: "user-exec" };
const pending = { role: "pending", id: "user-pending" };

// Context: user is on team-a
const onTeamA = { userTeamIds: ["team-a"] };
const onTeamB = { userTeamIds: ["team-b"] };
const noTeams = { userTeamIds: [] };

// Resource on team-a
const teamA = { teamId: "team-a" };
const teamB = { teamId: "team-b" };
const epicDriIsIc = { teamId: "team-a", driUserId: "user-ic" };
const epicDriIsOther = { teamId: "team-a", driUserId: "user-other" };

describe("can() permission helper", () => {
  describe("pending users", () => {
    const actions: Action[] = [
      "createTeam", "editTeam", "archiveTeam", "addMember", "removeMember",
      "createEpic", "editEpic", "setDriWeeks", "voteOnEpic", "updateStatus",
      "lockPlan", "closeQuarter", "reopenQuarter", "editCapacity",
      "viewTeam", "manageUsers", "conductInterview", "manageGoals",
    ];
    for (const action of actions) {
      it(`denies ${action}`, () => {
        expect(can(pending, action, teamA, onTeamA)).toBe(false);
      });
    }
  });

  describe("admin", () => {
    const actions: Action[] = [
      "createTeam", "editTeam", "archiveTeam", "addMember", "removeMember",
      "createEpic", "editEpic", "setDriWeeks", "voteOnEpic", "updateStatus",
      "lockPlan", "closeQuarter", "reopenQuarter", "editCapacity",
      "viewTeam", "manageUsers", "conductInterview", "manageGoals",
    ];
    for (const action of actions) {
      it(`allows ${action}`, () => {
        expect(can(admin, action, teamA, noTeams)).toBe(true);
      });
    }
  });

  describe("tpm", () => {
    it("allows createTeam", () => expect(can(tpm, "createTeam", {}, noTeams)).toBe(true));
    it("allows archiveTeam", () => expect(can(tpm, "archiveTeam", teamA, noTeams)).toBe(true));
    it("allows editTeam on any team", () => expect(can(tpm, "editTeam", teamA, noTeams)).toBe(true));
    it("allows addMember on any team", () => expect(can(tpm, "addMember", teamA, noTeams)).toBe(true));
    it("allows createEpic on any team", () => expect(can(tpm, "createEpic", teamA, noTeams)).toBe(true));
    it("allows editEpic on any team", () => expect(can(tpm, "editEpic", teamA, noTeams)).toBe(true));
    it("allows voteOnEpic on any team", () => expect(can(tpm, "voteOnEpic", teamA, noTeams)).toBe(true));
    it("allows updateStatus on any team", () => expect(can(tpm, "updateStatus", teamA, noTeams)).toBe(true));
    it("allows lockPlan on any team", () => expect(can(tpm, "lockPlan", teamA, noTeams)).toBe(true));
    it("allows closeQuarter", () => expect(can(tpm, "closeQuarter", {}, noTeams)).toBe(true));
    it("denies reopenQuarter", () => expect(can(tpm, "reopenQuarter", {}, noTeams)).toBe(false));
    it("allows editCapacity on any team", () => expect(can(tpm, "editCapacity", teamA, noTeams)).toBe(true));
    it("allows viewTeam", () => expect(can(tpm, "viewTeam", teamA, noTeams)).toBe(true));
    it("denies manageUsers", () => expect(can(tpm, "manageUsers", {}, noTeams)).toBe(false));
    it("allows conductInterview", () => expect(can(tpm, "conductInterview", {}, noTeams)).toBe(true));
    it("allows manageGoals", () => expect(can(tpm, "manageGoals", {}, noTeams)).toBe(true));
  });

  describe("em", () => {
    it("denies createTeam", () => expect(can(em, "createTeam", {}, onTeamA)).toBe(false));
    it("denies archiveTeam", () => expect(can(em, "archiveTeam", teamA, onTeamA)).toBe(false));
    it("allows editTeam on own team", () => expect(can(em, "editTeam", teamA, onTeamA)).toBe(true));
    it("denies editTeam on other team", () => expect(can(em, "editTeam", teamB, onTeamA)).toBe(false));
    it("allows addMember on own team", () => expect(can(em, "addMember", teamA, onTeamA)).toBe(true));
    it("denies addMember on other team", () => expect(can(em, "addMember", teamB, onTeamA)).toBe(false));
    it("allows createEpic on own team", () => expect(can(em, "createEpic", teamA, onTeamA)).toBe(true));
    it("denies createEpic on other team", () => expect(can(em, "createEpic", teamB, onTeamA)).toBe(false));
    it("allows editEpic on own team", () => expect(can(em, "editEpic", teamA, onTeamA)).toBe(true));
    it("allows setDriWeeks on own team", () => expect(can(em, "setDriWeeks", teamA, onTeamA)).toBe(true));
    it("allows voteOnEpic on own team", () => expect(can(em, "voteOnEpic", teamA, onTeamA)).toBe(true));
    it("allows updateStatus on own team", () => expect(can(em, "updateStatus", teamA, onTeamA)).toBe(true));
    it("allows lockPlan on own team", () => expect(can(em, "lockPlan", teamA, onTeamA)).toBe(true));
    it("denies lockPlan on other team", () => expect(can(em, "lockPlan", teamB, onTeamA)).toBe(false));
    it("denies closeQuarter", () => expect(can(em, "closeQuarter", {}, onTeamA)).toBe(false));
    it("denies reopenQuarter", () => expect(can(em, "reopenQuarter", {}, onTeamA)).toBe(false));
    it("allows editCapacity on own team", () => expect(can(em, "editCapacity", teamA, onTeamA)).toBe(true));
    it("denies editCapacity on other team", () => expect(can(em, "editCapacity", teamB, onTeamA)).toBe(false));
    it("allows viewTeam on any team", () => expect(can(em, "viewTeam", teamB, onTeamA)).toBe(true));
    it("denies manageUsers", () => expect(can(em, "manageUsers", {}, onTeamA)).toBe(false));
    it("denies conductInterview", () => expect(can(em, "conductInterview", {}, onTeamA)).toBe(false));
    it("denies manageGoals", () => expect(can(em, "manageGoals", {}, onTeamA)).toBe(false));
  });

  describe("ic", () => {
    it("denies createTeam", () => expect(can(ic, "createTeam", {}, onTeamA)).toBe(false));
    it("denies editTeam", () => expect(can(ic, "editTeam", teamA, onTeamA)).toBe(false));
    it("denies addMember", () => expect(can(ic, "addMember", teamA, onTeamA)).toBe(false));
    it("allows createEpic on own team", () => expect(can(ic, "createEpic", teamA, onTeamA)).toBe(true));
    it("denies createEpic on other team", () => expect(can(ic, "createEpic", teamB, onTeamA)).toBe(false));
    it("allows editEpic on own team", () => expect(can(ic, "editEpic", teamA, onTeamA)).toBe(true));
    it("denies editEpic on other team", () => expect(can(ic, "editEpic", teamB, onTeamA)).toBe(false));
    it("allows setDriWeeks when IC is the DRI", () => {
      expect(can(ic, "setDriWeeks", epicDriIsIc, onTeamA)).toBe(true);
    });
    it("denies setDriWeeks when IC is not the DRI", () => {
      expect(can(ic, "setDriWeeks", epicDriIsOther, onTeamA)).toBe(false);
    });
    it("allows voteOnEpic on own team", () => expect(can(ic, "voteOnEpic", teamA, onTeamA)).toBe(true));
    it("denies voteOnEpic on other team", () => expect(can(ic, "voteOnEpic", teamB, onTeamA)).toBe(false));
    it("allows updateStatus on own team", () => expect(can(ic, "updateStatus", teamA, onTeamA)).toBe(true));
    it("denies lockPlan", () => expect(can(ic, "lockPlan", teamA, onTeamA)).toBe(false));
    it("denies closeQuarter", () => expect(can(ic, "closeQuarter", {}, onTeamA)).toBe(false));
    it("denies editCapacity", () => expect(can(ic, "editCapacity", teamA, onTeamA)).toBe(false));
    it("allows viewTeam on any team", () => expect(can(ic, "viewTeam", teamB, onTeamA)).toBe(true));
    it("denies manageUsers", () => expect(can(ic, "manageUsers", {}, onTeamA)).toBe(false));
    it("denies conductInterview", () => expect(can(ic, "conductInterview", {}, onTeamA)).toBe(false));
  });

  describe("exec", () => {
    it("denies createTeam", () => expect(can(exec, "createTeam", {}, noTeams)).toBe(false));
    it("denies editTeam", () => expect(can(exec, "editTeam", teamA, noTeams)).toBe(false));
    it("denies createEpic", () => expect(can(exec, "createEpic", teamA, noTeams)).toBe(false));
    it("denies editEpic", () => expect(can(exec, "editEpic", teamA, noTeams)).toBe(false));
    it("denies voteOnEpic", () => expect(can(exec, "voteOnEpic", teamA, noTeams)).toBe(false));
    it("denies lockPlan", () => expect(can(exec, "lockPlan", teamA, noTeams)).toBe(false));
    it("denies closeQuarter", () => expect(can(exec, "closeQuarter", {}, noTeams)).toBe(false));
    it("denies editCapacity", () => expect(can(exec, "editCapacity", teamA, noTeams)).toBe(false));
    it("allows viewTeam", () => expect(can(exec, "viewTeam", teamA, noTeams)).toBe(true));
    it("denies manageUsers", () => expect(can(exec, "manageUsers", {}, noTeams)).toBe(false));
    it("denies conductInterview", () => expect(can(exec, "conductInterview", {}, noTeams)).toBe(false));
  });

  describe("edge cases", () => {
    it("denies unknown action", () => {
      expect(can(admin, "unknownAction" as Action, {}, noTeams)).toBe(true); // admin gets everything
      expect(can(tpm, "unknownAction" as Action, {}, noTeams)).toBe(false); // unknown falls to default
    });

    it("denies when no teamId provided for team-scoped action", () => {
      expect(can(em, "editEpic", {}, onTeamA)).toBe(false);
    });

    it("denies when user has no teams", () => {
      expect(can(ic, "createEpic", teamA, noTeams)).toBe(false);
    });
  });
});
