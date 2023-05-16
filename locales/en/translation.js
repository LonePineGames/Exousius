module.exports = {

  "action.go": "go",
  "action.create": "create",
  "action.give": "give",
  "action.scry": "scry",
  "action.return": "return",
  "action.disappear": "disappear",
  "action.strike": "strike",
  "action.summon": "summon",
  "action.heal": "heal",
  "action.protect": "protect",
  "action.search": "search",
  "action.destroy": "destroy",

  "intro": "Who is that wandering about the void? %summon Player%",

  "origin.name": "origin",
  "origin.description": "In a deep underground room, there is a shrine built around a spring of water. The only light is glowing blue crystals mounted on the mossy walls.",

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


%%% CHARACTER
Name: Omod
Title: He
Description: Omod is a powerful wizard. He wears a robe and carries a wooden staff. 
%%%

%summon Omod%
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
  "destroy.wouldOrphan": "But {{actor.name}} couldn't destroy the {{actor.room}} because that would leave the {{orphanedRoom}} without a path to the origin.",
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

  "link.noShards": "{{actor.name}} wanted to create a path to the {{targetRoom}}, but they didn't have any shards.",
  "link.alreadyExisted": "{{actor.name}} wanted to create a path to the {{targetRoom}}, but the path already existed.",
  "link.badRoom": "{{actor.name}} wanted to create a path to a placed called \"the {{targetRoom}}\", but that place didn't exist.",
  "link.success": "{{actor.name}} used a shard and created a path to the {{targetRoom}}.",

  "unlink.noShards": "{{actor.name}} wanted to destroyed the path to the {{targetRoom}}, but they didn't have any shards.",
  "unlink.didntExist": "{{actor.name}} wanted to destroyed the path to the {{targetRoom}}, but the path already didn't exist.",
  "unlink.badRoom": "{{actor.name}} wanted to destroyed the path to a placed called \"the {{targetRoom}}\", but that place didn't exist.",
  "unlink.wouldOrphan": "{{actor.name}} wanted to destroyed the path to the {{targetRoom}}, but that would leave the {{orphanedRoom}} without a path to the origin.",
  "unlink.success": "{{actor.name}} used a shard and destroyed the path to the {{targetRoom}}.",

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

  /* tutorial */

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

  /* prompt.bot */

  "prompt.bot": `This is a text-based role playing game set in a medieval fantasy world. I am {{actor.name}}. I was summoned by {{actor.summoner}}.

{{actor.script}}

### Suggested Actions
{{suggestionsText}}

### Context
I am in the {{actor.room}}. Beings in the {{actor.room}}: {{inRoomText}}. I have {{actor.hp}}/{{maxHP}} HP and I am carrying {{actor.shards}} shards.

### Instructions
Output only {{actor.name}}'s response. Keep the response brief, under 20 words. If {{actor.name}} does an action, output one of the suggested actions as part of the response. Example:
{{actor.name}}: I must go! %go forest%

### History
{{historyText}}

### Response
{{actor.name}}: `,

  /* prompt.narration */

  "prompt.narration": `This is a text-based role playing game set in a medieval fantasy world. I am the narrator.

### Context
{{room.description}} Beings currently in the {{room.name}}: {{inRoomText}}. Only these beings are here.

{{descriptions}}

{{pronounHint}}

### Instructions
Improve the following narration. Keep the response brief, under 20 words. Preserve all details, especially numbers. Fix any grammatical mistakes, capitalization and pluralization issues, and so on. Add drama and enticing language. Make the general more specific (eg "ate food" => "had a wonderful meal of cooked rabbit"). Only describe the events mentioned in the original narration. Use past tense. Connect the narration to the history and context. Make it sound like an old fairy tale.

### Example
Original: Arkim healed Arkim for 2HP. Arkim searched the origin and found a shard. Arkim searched the origin for shards. Arkim found some useful items, but no shards. rowdy bard struck Arkim.
Response: After the battle, Arkim healed himself for 2HP. Then he turned to his most important task: the search for shards. For hours, he searched the dark void, fruitlessly... Until, finally, he found a shard! His spirits raised, he continued his search. But a second shard would be elusive, as Arkim's fervent search only yielded an old pickaxe. Rowdy bard suddenly attacked.

### History
{{historyText}}

### Original Narration
Narrator: {{narration}}

### Response
Narrator: `,

};

