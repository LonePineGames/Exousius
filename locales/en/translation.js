module.exports = {

  "character.selfSummonInstructions": `Please enter your character information in the following format:

%%%! CHARACTER
Name: Your Name
Title: He/She/They/etc
Description: Your character description. Make sure to include your name and weapon.
%%%

Then summon yourself by typing %summon Your Name%.`,

/*
%%% CHARACTER
Name: Tester
Title: He
Description: Tester Testerossa lives on 123 Test Avenue, Anytown, Ohio, USA. Except in Nebraska.
%%%

%summon Tester%
*/

  "action.did": "{{actor.name}} did: {{actionText}}.",
  "place.describe": "It was a beautiful {{room}}.",

  // Actions
  "create.didntKnow": "But first {{actor.name}} needed to determine what location to create. Perhaps %create ancient forest% or %create secret tavern%?",
  "create.alreadyExisted": "But {{actor.name}} couldn't create the {{targetRoom}} because it already existed at that time.",
  "create.noShards": "But {{actor.name}} couldn't create the {{targetRoom}} because they didn't have any shards.",
  "create.success": "{{actor.name}} used a shard and created the {{targetRoom}}.",

  "destroy.cantOrigin": "But no one can destroy the origin, not even {{actor.name}}",
  "destroy.noShards": "But {{actor.name}} couldn't destroy the {{actor.room}} because they didn't have any shards.",
  "destroy.success": "{{actor.name}} used a shard and destroyed the {{actor.room}}.",

  "disappear.success": "{{actor.name}} decided to leave our heros alone.",

  "give.self": "{{actor.name}}'s left hand gave {{actor.name}}'s right hand {{number}} shards.",
  "give.noShards": "But {{actor.name}} couldn't give {{targetName}} {{number}} shards because they didn't have that many.",
  "give.badName": "But {{actor.name}} couldn't give {{targetName}} {{number}} shards because they couldn't find them.",
  "give.alreadyReturned": "But {{actor.name}} couldn't give {{targetName}} {{number}} shards because they had already returned to their summoner.",
  "give.notInRoom": "But {{actor.name}} couldn't give {{targetName}} {{number}} shards because they weren't in the {{actor.room}}.",
  "give.success": "{{actor.name}} gave {{targetName}} {{number}} shards.",

  "go.alreadyThere": "{{actor.name}} was already in the {{targetRoom}}.",
  "go.didntExist": "{{actor.name}} wanted to go to the {{targetRoom}}, but that place hadn't been created yet.",
  "go.success": "{{actor.name}} went to the {{targetRoom}}.",

  "heal.badName": "But {{actor.name}} couldn't heal {{targetName}} because they couldn't find them.",
  "heal.alreadyDead": "But {{actor.name}} couldn't heal {{targetName}} because they were already dead.",
  "heal.alreadyReturned": "But {{actor.name}} couldn't heal {{targetName}} because they had already returned to their summoner.",
  "heal.notInRoom": "But {{actor.name}} couldn't heal {{targetName}} because {{targetName}} wasn't in the {{actor.room}}.",
  "heal.alreadyFull": "But {{actor.name}} couldn't heal {{targetName}} because they were already at full health.",
  "heal.self.alreadyFull": "But {{actor.name}} couldn't heal because they were already at full health.",
  "heal.self": "{{actor.name}} healed themselves for {{heal}} health.",
  "heal.other": "{{actor.name}} healed {{targetName}} for {{heal}} health.",
  "heal.rest": "{{actor.name}} rested for a few hours, ate some food and tended to their wounds. {{actor.name}} healed {{heal}}HP.",

  "magic.changed.on": "{{actor.name}} turned on improved storytelling.",
  "magic.changed.off": "{{actor.name}} turned off improved storytelling.",
  "magic.status.on": "Improved storytelling was turned on.",
  "magic.status.off": "Improved storytelling was turned off.",
  "magic.invalid": "But {{actor.name}} couldn't change the magic. Valids magics are \"on\" and \"off\".",

  "mob": "mob",
  "mob.hello": "Hello!",
  "mob.spawn": "{{actor.name}} appeared in the {{actor.room}}.",

  "mode.turns": "The world moved in turns.",
  "mode.time": "The world moved at the pace of one event every {{seconds}} seconds.",
  "mode.turns.changed": "{{actor.name}} used magic. The world began to move in turns.",
  "mode.time.changed": "{{actor.name}} used magic. The world began to move at the pace of one event every {{seconds}} seconds.",
  "mode.invalid": "But {{actor.name}} couldn't change the mode. Valids modes are \"turns\" and \"time\".",

  "pace.turns": "The world moved in turns.",
  "pace.seconds": "The world moved at the pace of one event every {{seconds}} seconds.",
  "pace.paused": "The world was paused.",
  "pace.nan": "But {{actor.name}} couldn't change the pace of the world because {{action.text}} wasn't a number.",
  "pace.pause.noShards": "But {{actor.name}} couldn't pause the world because they didn't have any shards.",
  "pace.pause": "{{actor.name}} sacrificed a shard to pause the world.",
  "pace.faster.noShards": "But {{actor.name}} couldn't increase the pace of the world because they didn't have any shards.",
  "pace.faster": "{{actor.name}} sacrificed a shard to increase the pace of the world to one event every {{seconds}} seconds.",
  "pace.faster.limited": "{{actor.name}} sacrificed a shard to increase the pace of the world to one event every {{seconds}} seconds. The pace can't go any faster.",
  "pace.slower": "{{actor.name}} decreased the pace of the world to one event every {{seconds}} seconds.",

  "protect.noShards": "But {{actor.name}} couldn't protect the {{actor.room}} because they didn't have any shards.",
  "protect.noMobs": "But {{actor.name}} couldn't protect the {{actor.room}} because there were no enemies to protect it from.",
  "protect.success": "{{actor.name}} used a shard and protected the {{actor.room}} from minor enemies.",

  "return.success": "{{actor.name}} returned to their summoner and gave them {{shards}} shards, their task complete. They then disappeared in a puff of smoke.",
  "scry.noShards": "But {{actor.name}} couldn't scry {{targetName}} because they didn't have any shards.",
  "scry.noShards": "{{actor.name}} wanted to seen into the past, but they didn't have any shards.",
  "scry.success": "{{actor.name}} sacrificed a shard to look into the past. {{actor.name}} can now see everything that has ever happened in the {{actor.room}}.",

  "search.fail": "{{actor.name}} searched the {{actor.room}} for shards, but found nothing.",
  "search.foundItems": "{{actor.name}} searched the {{actor.room}}. {{actor.name}} found some useful items, but no shards.",
  "search.foundShard": "{{actor.name}} searched the {{actor.room}} and found a shard.",

  "strike.badName": "But {{actor.name}} couldn't strike {{targetName}} because they couldn't find them.",
  "strike.alreadyDead": "But {{actor.name}} couldn't strike {{targetName}} because they were already dead.",
  "strike.notInRoom": "But {{actor.name}} couldn't strike {{targetName}} because they weren't in the same room.",
  "strike.missed": "{{actor.name}} tried to strike, but missed.",
  "strike.target.missed": "{{actor.name}} tried to strike {{targetName}}, but missed.",
  "strike.hit": "{{actor.name}} struck {{targetName}} for {{damage}} damage.",
  "strike.hit.sacrifice": "{{actor.name}} struck {{targetName}} for {{damage}} damage. {{targetName}} sacrificed {{sacrifice}} shards to block the damage.",
  "strike.hit.kill": "{{actor.name}} struck {{targetName}} for {{damage}} damage. {{targetName}} died.",
  "strike.hit.sacrifice.kill": "{{actor.name}} struck {{targetName}} for {{damage}} damage. {{targetName}} sacrificed {{sacrifice}} shards to block the damage, but it was not enough. {{targetName}} died.",

  "summon.noScript": "But {{actor.name}} couldn't summon {{summonName}} because there isn't a script named {{summonName}}.",
  "summon.noShards": "But {{actor.name}} couldn't summon {{summonName}} because they didn't have any shards.",
  "summon.success": "{{actor.name}} used a shard and summoned {{summonName}}.",
  "summon.player.origin": "{{summonName}} was summoned. {{summonName}} appeared in the origin.",

  "tutorial": `New to this world and unsure what to do, {{actor.name}} considered the many options:

%search% - to acquire shards
%go ...% - to explore the world.
%strike% - to fight
%heal% - to heal
%summon Odel% (Cost: 1 shard) - Odel is good at searching for shards.
%create ...% (Cost: 1 shard) - Creates a new land or location. You may create anything you imagine. New lands often have many shards to find, so the cost of a shard is a good investment.
%destroy% (Cost: 1 shard) - to destroy the land.
%protect% (Cost: 1 shard) - to protect the land from minor enemies.
%scry% (Cost: 1 shard) - to see what has happened here in the past.`,
};

