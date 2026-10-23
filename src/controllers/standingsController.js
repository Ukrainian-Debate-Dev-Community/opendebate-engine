const {
  Team,
  RoomTeam,
  EventParticipant,
  RoomSpeaker,
  Score,
} = require("../models");
const { hasEventPrivilege } = require("../middleware/authMiddleware");
const { getEventRooms } = require("../utils/finalRooms");
const {
  getCompletedEvents,
  getVisibleRooms,
  personKey,
  personRows,
} = require("../utils/organisationScope");

// Swing teams occupy slots and hold ranks (so they still count toward a
// room's N), but performances delivered in a swing slot are excluded from
// speaker standings, mirroring their exclusion from team standings.
const getSwingTeamIds = async (eventId) => {
  const swings = await Team.findAll({
    where: { event_id: eventId, is_swing: true },
    attributes: ["id"],
  });
  return new Set(swings.map((t) => t.id));
};

const getTeamStandings = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const isAuthorised = await hasEventPrivilege(
      req.user.id,
      req.user.isAdmin,
      Number(eventId),
    );

    // swing teams occupy room slots but never appear in standings
    const teams = await Team.findAll({
      where: { event_id: eventId, is_swing: false },
      attributes: ["id", "name"],
    });

    // authorised users see all rounds
    // others only see visible rounds
    const rooms = await getEventRooms([eventId], {
      includeHidden: isAuthorised,
    });
    const roomIds = rooms.map((r) => r.id);

    const roomTeams = await RoomTeam.findAll({
      where: { room_id: roomIds },
      attributes: ["team_id", "room_id", "rank"],
    });

    const standings = {};
    teams.forEach((t) => {
      standings[t.id] = { name: t.name, rooms: {} };
    });

    roomTeams.forEach((rt) => {
      if (standings[rt.team_id] && rt.rank !== null) {
        standings[rt.team_id].rooms[rt.room_id] = rt.rank;
      }
    });

    res.status(200).json({ status: "success", data: standings });
  } catch (error) {
    next(error);
  }
};

const getSpeakerStandings = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const isAuthorised = await hasEventPrivilege(
      req.user.id,
      req.user.isAdmin,
      Number(eventId),
    );

    const speakers = await EventParticipant.findAll({
      where: { event_id: eventId, role: "speaker" },
      attributes: ["id", "display_name"],
    });

    const rooms = await getEventRooms([eventId], {
      includeHidden: isAuthorised,
    });
    const roomIds = rooms.map((r) => r.id);

    const roomTeams = await RoomTeam.findAll({
      where: { room_id: roomIds },
      attributes: ["id", "room_id", "team_id"],
    });
    const roomTeamIds = roomTeams.map((rt) => rt.id);

    const swingTeamIds = await getSwingTeamIds(eventId);
    const rtToRoom = {};
    const swingRoomTeamIds = new Set();
    roomTeams.forEach((rt) => {
      rtToRoom[rt.id] = rt.room_id;
      if (swingTeamIds.has(rt.team_id)) {
        swingRoomTeamIds.add(rt.id);
      }
    });

    const roomSpeakers = await RoomSpeaker.findAll({
      where: { room_team_id: roomTeamIds, is_iron: false },
      attributes: ["participant_id", "room_team_id", "rank"],
    });

    const standings = {};
    speakers.forEach((s) => {
      standings[s.id] = { name: s.display_name, rooms: {} };
    });

    roomSpeakers.forEach((rs) => {
      if (swingRoomTeamIds.has(rs.room_team_id)) {
        return; // swing slot: performance excluded from speaker standings
      }
      if (standings[rs.participant_id] && rs.rank !== null) {
        const roomId = rtToRoom[rs.room_team_id];
        standings[rs.participant_id].rooms[roomId] = rs.rank;
      }
    });

    res.status(200).json({ status: "success", data: standings });
  } catch (error) {
    next(error);
  }
};

// Calculated standings, for N teams in a room:
// Team points: SUM of (N - rank)
// Speaker points: plain SUM of the speaker's speech scores, with their
// average and the number of speeches counted

const getCalculatedTeamStandings = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const isAuthorised = await hasEventPrivilege(
      req.user.id,
      req.user.isAdmin,
      Number(eventId),
    );

    // swing teams still count toward room sizes below, but earn no standings
    const teams = await Team.findAll({
      where: { event_id: eventId, is_swing: false },
      attributes: ["id", "name"],
    });

    const rooms = await getEventRooms([eventId], {
      includeHidden: isAuthorised,
    });
    const roomIds = rooms.map((r) => r.id);

    const roomTeams = await RoomTeam.findAll({
      where: { room_id: roomIds },
      attributes: ["team_id", "room_id", "rank"],
    });

    // determine number of teams per room dynamically
    const roomSizes = Object.create(null);
    roomTeams.forEach((rt) => {
      roomSizes[rt.room_id] = (roomSizes[rt.room_id] || 0) + 1;
    });

    const standings = Object.create(null);
    teams.forEach((t) => {
      standings[t.id] = { id: t.id, name: t.name, total_points: 0 };
    });

    roomTeams.forEach((rt) => {
      if (standings[rt.team_id] && rt.rank !== null) {
        const n = roomSizes[rt.room_id];
        standings[rt.team_id].total_points += n - rt.rank;
      }
    });

    const sortedStandings = Object.values(standings).sort(
      (a, b) => b.total_points - a.total_points,
    );

    res.status(200).json({ status: "success", data: sortedStandings });
  } catch (error) {
    next(error);
  }
};

const getCalculatedSpeakerStandings = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const isAuthorised = await hasEventPrivilege(
      req.user.id,
      req.user.isAdmin,
      Number(eventId),
    );

    const speakers = await EventParticipant.findAll({
      where: { event_id: eventId, role: "speaker" },
      attributes: ["id", "display_name"],
    });

    const rooms = await getEventRooms([eventId], {
      includeHidden: isAuthorised,
    });
    const roomIds = rooms.map((r) => r.id);

    const roomTeams = await RoomTeam.findAll({
      where: { room_id: roomIds },
      attributes: ["id", "room_id", "rank", "team_id"],
    });

    // speeches delivered in a swing slot are skipped below
    const swingTeamIds = await getSwingTeamIds(eventId);
    const swingRoomTeamIds = new Set();
    const rtToRank = Object.create(null);

    roomTeams.forEach((rt) => {
      rtToRank[rt.id] = rt.rank;
      if (swingTeamIds.has(rt.team_id)) {
        swingRoomTeamIds.add(rt.id);
      }
    });

    const roomTeamIds = roomTeams.map((rt) => rt.id);

    // an iron-person's second speech counts for the team only
    const roomSpeakers = await RoomSpeaker.findAll({
      where: { room_team_id: roomTeamIds, is_iron: false },
      attributes: ["id", "participant_id", "room_team_id", "rank"],
      include: [{ model: Score, attributes: ["value"] }],
    });

    const standings = Object.create(null);
    speakers.forEach((s) => {
      standings[s.id] = {
        id: s.id,
        name: s.display_name,
        total_points: 0,
        average_score: 0,
        speeches: 0,
      };
    });

    roomSpeakers.forEach((rs) => {
      if (swingRoomTeamIds.has(rs.room_team_id)) {
        return; // swing slot: performance excluded from speaker standings
      }
      const standing = standings[rs.participant_id];
      if (standing && rs.Scores && rs.Scores.length > 0) {
        const rank = rtToRank[rs.room_team_id];
        if (rank !== undefined && rank !== null) {
          standing.total_points += parseFloat(rs.Scores[0].value);
          standing.speeches += 1;
        }
      }
    });

    const sortedStandings = Object.values(standings)
      .map((s) => {
        s.total_points = parseFloat(s.total_points.toFixed(2));
        s.average_score =
          s.speeches > 0
            ? parseFloat((s.total_points / s.speeches).toFixed(2))
            : 0;
        return s;
      })
      .sort(
        (a, b) =>
          b.total_points - a.total_points || b.average_score - a.average_score,
      );

    res.status(200).json({ status: "success", data: sortedStandings });
  } catch (error) {
    next(error);
  }
};

// GET /api/organisations/:organisationId/standings/speakers
// Every speaker of the organisation's finished events as one person per
// user account (a guest: per participant, never merged by name), counted
// like the per-event calculated speaker standings: raw points of ranked
// slots, an iron-person's second speech and swing slots left out.
const getOrganisationSpeakerStandings = async (req, res, next) => {
  try {
    const { organisationId } = req.params;
    const events = await getCompletedEvents(organisationId);
    const eventIds = events.map((e) => e.id);
    if (eventIds.length === 0) {
      return res.status(200).json({ status: "success", data: [] });
    }

    const speakers = await EventParticipant.findAll({
      where: { event_id: eventIds, role: "speaker" },
      attributes: ["id", "user_id", "display_name", "event_id"],
      order: [
        ["event_id", "ASC"],
        ["id", "ASC"],
      ],
    });
    const keyOf = Object.create(null);
    speakers.forEach((s) => {
      keyOf[s.id] = personKey(s);
    });

    const rooms = await getVisibleRooms(req.user, organisationId, eventIds);
    const roomTeams = await RoomTeam.findAll({
      where: { room_id: rooms.map((r) => r.id) },
      attributes: ["id", "rank", "team_id"],
    });

    const swingTeamIds = new Set(
      (
        await Team.findAll({
          where: { event_id: eventIds, is_swing: true },
          attributes: ["id"],
        })
      ).map((t) => t.id),
    );
    const swingRoomTeamIds = new Set();
    const rtToRank = Object.create(null);
    roomTeams.forEach((rt) => {
      rtToRank[rt.id] = rt.rank;
      if (swingTeamIds.has(rt.team_id)) swingRoomTeamIds.add(rt.id);
    });

    const roomSpeakers = await RoomSpeaker.findAll({
      where: { room_team_id: roomTeams.map((rt) => rt.id), is_iron: false },
      attributes: ["id", "participant_id", "room_team_id"],
      include: [{ model: Score, attributes: ["value"] }],
    });

    const people = personRows(speakers);
    Object.values(people).forEach((person) => {
      person.total_points = 0;
      person.average_score = 0;
      person.speeches = 0;
    });

    roomSpeakers.forEach((rs) => {
      if (swingRoomTeamIds.has(rs.room_team_id)) return;
      const person = people[keyOf[rs.participant_id]];
      const rank = rtToRank[rs.room_team_id];
      if (person && rs.Scores && rs.Scores.length > 0 && rank != null) {
        person.total_points += parseFloat(rs.Scores[0].value);
        person.speeches += 1;
      }
    });

    const data = Object.values(people)
      .map((p) => {
        p.total_points = parseFloat(p.total_points.toFixed(2));
        p.average_score =
          p.speeches > 0
            ? parseFloat((p.total_points / p.speeches).toFixed(2))
            : 0;
        return p;
      })
      .sort(
        (a, b) =>
          b.total_points - a.total_points || b.average_score - a.average_score,
      );

    res.status(200).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganisationSpeakerStandings,
  getTeamStandings,
  getSpeakerStandings,
  getCalculatedSpeakerStandings,
  getCalculatedTeamStandings,
};
