const request = require("supertest");
const app = require("../src/app");
const {
  sequelize,
  User,
  Organisation,
  Event,
  Round,
  Format,
  EventParticipant,
  Team,
  Room,
  RoomTeam,
  RoomSpeaker,
  RoomAdjudicator,
  Score,
  Feedback,
} = require("../src/models");
const jwt = require("jsonwebtoken");

const sign = (id) =>
  jwt.sign({ id, isAdmin: false }, process.env.JWT_SECRET || "testsecret", {
    expiresIn: "1h",
  });

describe("Organisation-wide standings and stats", () => {
  let token;
  let orgId;
  let emptyOrgId;
  let anna;
  let ben;
  let judge;
  let formatId;


  // an event with one completed room: Anna and a guest win, Ben (iron:
  // his second speech marked) is second; the judge chairs and gets
  // `feedback`
  const playEvent = async (status, annaName, guestName, feedback) => {
    const event = await Event.create({
      organisation_id: orgId,
      name: `${status} night ${annaName}`,
      status,
    });
    const seat = async (name, role, userId = null) =>
      (
        await EventParticipant.create({
          event_id: event.id,
          display_name: name,
          role,
          user_id: userId,
        })
      ).id;
    const s = {
      anna: await seat(annaName, "speaker", anna.id),
      ben: await seat("Ben", "speaker", ben.id),
      guest: await seat(guestName, "speaker"),
      other1: await seat("Other 1", "speaker"),
      other2: await seat("Other 2", "speaker"),
    };
    const judgeSeat = await seat("Judge", "adjudicator", judge.id);

    const round = await Round.create({
      event_id: event.id,
      name: "Round 1",
      sequence: 1,
      is_hidden: false,
    });
    const room = await Room.create({
      round_id: round.id,
      format_id: formatId,
      status: "completed",
    });
    const chair = await RoomAdjudicator.create({
      room_id: room.id,
      participant_id: judgeSeat,
      role: "chair",
    });

    const lineup = [
      [1, [[s.anna, 75], [s.guest, 65]]],
      [2, [[s.ben, 70], [s.ben, 60, true]]],
      [3, [[s.other1, 68]]],
      [4, [[s.other2, 66]]],
    ];
    let position = 1;
    for (const [rank, speeches] of lineup) {
      const team = await Team.create({
        event_id: event.id,
        name: `Team ${position}`,
      });
      const roomTeam = await RoomTeam.create({
        room_id: room.id,
        team_id: team.id,
        position,
        rank,
      });
      position += 1;
      for (const [participantId, value, isIron] of speeches) {
        const roomSpeaker = await RoomSpeaker.create({
          room_team_id: roomTeam.id,
          participant_id: participantId,
          rank,
          is_iron: Boolean(isIron),
        });
        await Score.create({
          room_speaker_id: roomSpeaker.id,
          room_adjudicator_id: chair.id,
          value,
        });
      }
    }
    // each feedback from a different speaker of the room
    const issuers = [s.anna, s.ben, s.other1, s.other2];
    for (const [index, score] of feedback.entries()) {
      await Feedback.create({
        room_id: room.id,
        adjudicator_id: judgeSeat,
        issuer_team_id: null,
        issuer_participant_id: issuers[index],
        score,
      });
    }
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const viewer = await User.create({
      username: "org_viewer",
      password: "hashedpassword123",
    });
    token = sign(viewer.id);
    anna = await User.create({ username: "anna", password: "pw-anna-123" });
    ben = await User.create({ username: "ben", password: "pw-ben-123" });
    judge = await User.create({ username: "judge", password: "pw-judge-1" });

    orgId = (await Organisation.create({ name: "Club Org" })).id;
    emptyOrgId = (await Organisation.create({ name: "Quiet Org" })).id;

    formatId = (
      await Format.create({
        name: "British Parliamentary",
        code: "BPO",
        teams_per_room: 4,
        speakers_per_team: 2,
        score_min: 50,
        score_max: 100,
      })
    ).id;

    // two finished events (the second guest only shares the first's
    // name) and a scheduled one whose points never count
    await playEvent("completed", "Anna (first)", "Guest", [8, 6]);
    await playEvent("completed", "Anna (latest)", "Guest", [10]);
    await playEvent("scheduled", "Anna (later)", "Guest c", [1]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("speakers: one row per account, raw points, irons and unfinished left out", async () => {
    const res = await request(app)
      .get(`/api/organisations/${orgId}/standings/speakers`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const rows = res.body.data;

    const annaRow = rows.find((r) => r.user_id === anna.id);
    expect(annaRow).toEqual({
      user_id: anna.id,
      participant_id: null,
      name: "Anna (latest)",
      total_points: 150,
      average_score: 75,
      speeches: 2,
    });

    // the iron's second speech counts for the team only
    const benRow = rows.find((r) => r.user_id === ben.id);
    expect(benRow.total_points).toBe(140);
    expect(benRow.speeches).toBe(2);

    // two guests named alike stay two people
    const guests = rows.filter((r) => r.name === "Guest");
    expect(guests).toHaveLength(2);
    guests.forEach((g) => {
      expect(g.user_id).toBeNull();
      expect(g.participant_id).toEqual(expect.any(Number));
      expect(g.total_points).toBe(65);
    });
    expect(rows.some((r) => r.name === "Guest c")).toBe(false);

    // best total first
    expect(rows[0].user_id).toBe(anna.id);
  });

  test("adjudicators: all their feedback in one average, the base once", async () => {
    const plain = await request(app)
      .get(`/api/organisations/${orgId}/stats/adjudicators`)
      .set("Authorization", `Bearer ${token}`);
    expect(plain.statusCode).toBe(200);
    expect(plain.body.data).toEqual([
      {
        user_id: judge.id,
        participant_id: null,
        name: "Judge",
        rooms_adjudicated: 2,
        feedback_count: 3,
        avg_feedback: 8,
      },
    ]);

    // (5 + 8 + 6 + 10) / 4, not an average of the event averages
    const based = await request(app)
      .get(`/api/organisations/${orgId}/stats/adjudicators?base=5`)
      .set("Authorization", `Bearer ${token}`);
    expect(based.body.data[0].avg_feedback).toBe(7.25);
    expect(based.body.data[0].feedback_count).toBe(3);

    const bad = await request(app)
      .get(`/api/organisations/${orgId}/stats/adjudicators?base=x`)
      .set("Authorization", `Bearer ${token}`);
    expect(bad.statusCode).toBe(400);
  });

  test("no finished events: empty lists; unknown organisation: 404", async () => {
    for (const path of ["standings/speakers", "stats/adjudicators"]) {
      const empty = await request(app)
        .get(`/api/organisations/${emptyOrgId}/${path}`)
        .set("Authorization", `Bearer ${token}`);
      expect(empty.statusCode).toBe(200);
      expect(empty.body.data).toEqual([]);

      for (const id of [999999, "abc"]) {
        const missing = await request(app)
          .get(`/api/organisations/${id}/${path}`)
          .set("Authorization", `Bearer ${token}`);
        expect(missing.statusCode).toBe(404);
      }

      const anonymous = await request(app).get(
        `/api/organisations/${orgId}/${path}`,
      );
      expect(anonymous.statusCode).toBe(401);
    }
  });
});
