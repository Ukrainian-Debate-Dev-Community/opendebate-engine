// Shared scope of the organisation-wide standings and stats: the
// organisation's finished events, their rooms as the requester may see
// them, and how participants of several events become one person.
const { Organisation, Event, Owner, Organizer } = require("../models");
const AppError = require("./AppError");
const { getEventRooms } = require("./finalRooms");

// The organisation's finished events (status "completed"), oldest
// first; an unknown or malformed id is a 404.
const getCompletedEvents = async (organisationId) => {
  const id = Number(organisationId);
  const organisation =
    Number.isInteger(id) && id > 0 ? await Organisation.findByPk(id) : null;
  if (!organisation) throw new AppError("Organisation not found.", 404);

  return Event.findAll({
    where: { organisation_id: id, status: "completed" },
    attributes: ["id"],
    order: [["id", "ASC"]],
  });
};

// The events' rooms with each event's hidden rounds only where the
// requester may see them, as the per-event endpoints do: an admin or an
// owner of the organisation sees every event's, an organiser their own.
const getVisibleRooms = async (
  user,
  organisationId,
  eventIds,
  { finalOnly = false } = {},
) => {
  if (eventIds.length === 0) return [];

  let privileged;
  const isOwner =
    !user.isAdmin &&
    (await Owner.findOne({
      where: { user_id: user.id, organisation_id: Number(organisationId) },
    }));
  if (user.isAdmin || isOwner) {
    privileged = new Set(eventIds);
  } else {
    const organised = await Organizer.findAll({
      where: { user_id: user.id, event_id: eventIds },
      attributes: ["event_id"],
    });
    privileged = new Set(organised.map((o) => o.event_id));
  }

  const open = eventIds.filter((id) => !privileged.has(id));
  const [hidden, shown] = await Promise.all([
    privileged.size > 0
      ? getEventRooms([...privileged], { includeHidden: true, finalOnly })
      : [],
    open.length > 0
      ? getEventRooms(open, { includeHidden: false, finalOnly })
      : [],
  ]);
  return [...hidden, ...shown];
};

// One person across events: their user account, or - a guest without
// one - the participant alone; never merged by name.
const personKey = (participant) =>
  participant.user_id ? `u${participant.user_id}` : `p${participant.id}`;

// A person's row head: the account (null for a guest), the guest's
// participant id (null for an account) and the name of their latest
// event (participants come oldest event first).
const personRows = (participants) => {
  const people = Object.create(null);
  participants.forEach((p) => {
    const key = personKey(p);
    people[key] = {
      user_id: p.user_id || null,
      participant_id: p.user_id ? null : p.id,
      name: p.display_name,
    };
  });
  return people;
};

module.exports = {
  getCompletedEvents,
  getVisibleRooms,
  personKey,
  personRows,
};
