"use strict";

// Australs: Government v Opposition, three speakers a team, no reply
// speech, speakers scored as in BP. Id 2 next to BP's 1 (the server's
// reference data inserts BP as id 1 after the migrations); another id
// when 2 is taken. Platforms find it by its code, AUS.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO formats (id, name, code, teams_per_room, speakers_per_team, has_reply, score_min, score_max)
      SELECT 2, 'Australs', 'AUS', 2, 3, false, 50, 100
      WHERE NOT EXISTS (SELECT 1 FROM formats WHERE code = 'AUS' OR id = 2);

      INSERT INTO formats (name, code, teams_per_room, speakers_per_team, has_reply, score_min, score_max)
      SELECT 'Australs', 'AUS', 2, 3, false, 50, 100
      WHERE NOT EXISTS (SELECT 1 FROM formats WHERE code = 'AUS');

      SELECT setval('formats_id_seq', GREATEST((SELECT max(id) FROM formats), 1));
    `);
  },

  // only while no room uses it
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM formats
      WHERE code = 'AUS' AND NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.format_id = formats.id);
    `);
  },
};
