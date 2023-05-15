module.exports = {
  "character.selfSummonInstructions": `โปรดป้อนข้อมูลตัวละครของคุณตามรูปแบบดังต่อไปนี้:

%%%! CHARACTER
Name: [ชื่อของคุณ]
Title: [เขา/เธอ/พวกเขา/ฯลฯ]
Description: [คำอธิบายตัวละครของคุณ อย่าลืมรวมชื่อและอาวุธของคุณด้วย]
%%%

จากนั้นเรียกตัวเองโดยพิมพ์ %summon [ชื่อของคุณ]%.`,

/*
%%% CHARACTER
Name: ปราสาทแห่งแสง
Title: เธอ
Description: ปราสาทแห่งแสง, ซึ่งเป็นพ่อมดหญิงที่มีอำนาจในเวทมนตร์แห่งแสง, คอยค้นหาความรู้และความจริงที่ซ่อนอยู่ในโลกนี้ด้วยไม้เท้ามหัศจรรย์ของเธอ
%%%

%summon ปราสาทแห่งแสง%

%%% CHARACTER
ชื่อ: ทดสอบ
คำนำหน้า: เขา
คำอธิบาย: ทดสอบ ทดสอบโรสซ่า อาศัยอยู่ที่ 123 ถนนทดสอบ, ทุกทาวน์, โอไฮโอ, สหรัฐอเมริกา. ยกเว้นในเนบราสก้า.
%%%

%summon ทดสอบ%
*/

  "place.describe": "นี่เป็น{{room}}ที่สวยงาม.",
  "search.fail": "{{actor.name}} ค้นหาใน {{room}} แต่ไม่พบเศษส่วนใดๆ",
  "search.foundItems": "{{actor.name}} ค้นหาใน {{room}}. {{actor.name}} พบไอเท็มที่มีประโยชน์บางอย่างแต่ไม่พบเศษส่วน",

  "action.did": "{{actor.name}} ทำ: {{actionText}}.",
  "place.describe": "มันเป็น{{room}}ที่สวยงาม.",

  // Actions
  "create.didntKnow": "แต่{{actor.name}}ต้องตัดสินใจก่อนว่าจะสร้างสถานที่อะไร เช่น %create ป่าโบราณ% หรือ %create โรงเตี๊ยมลับ%?",
  "create.alreadyExisted": "แต่{{actor.name}}ไม่สามารถสร้าง{{targetRoom}}ได้เพราะมันมีอยู่แล้วในเวลานั้น.",
  "create.noShards": "แต่{{actor.name}}ไม่สามารถสร้าง{{targetRoom}}ได้เพราะเขาไม่มีชิ้นส่วนใดๆ.",
  "create.success": "{{actor.name}}ใช้ชิ้นส่วนหนึ่งและสร้าง{{targetRoom}}.",

  "destroy.cantOrigin": "แต่ไม่มีใครสามารถทำลายต้นกำเนิดได้, ไม่ว่าจะเป็น {{actor.name}}",
  "destroy.noShards": "แต่{{actor.name}}ไม่สามารถทำลาย{{actor.room}}ได้เพราะเขาไม่มีชิ้นส่วนใดๆ.",
  "destroy.success": "{{actor.name}}ใช้ชิ้นส่วนหนึ่งและทำลาย{{actor.room}}.",

  "disappear.success": "{{actor.name}}ตัดสินใจที่จะทิ้งเหล่าฮีโร่เราไว้คนเดียว.",

  "give.self": "มือซ้ายของ{{actor.name}}ให้มือขวาของ{{actor.name}}ชิ้นส่วน{{number}}.",
  "give.noShards": "แต่{{actor.name}}ไม่สามารถให้{{targetName}}ชิ้นส่วน{{number}}ได้เพราะเขาไม่มีจำนวนเท่านั้น.",
  "give.badName": "แต่{{actor.name}}ไม่สามารถให้{{targetName}}ชิ้นส่วน{{number}}ได้เพราะเขาไม่สามารถหาพวกเขา.",
  "give.alreadyReturned": "แต่{{actor.name}}ไม่สามารถให้{{targetName}}ชิ้นส่วน{{number}}ได้เพราะพวกเขาได้กลับมายังผู้เรียกของพวกเขาแล้ว.",
  "give.notInRoom": "แต่{{actor.name}}ไม่สามารถให้{{targetName}}ชิ้นส่วน{{number}}ได้เพราะพวกเขาไม่ได้อยู่ใน{{actor.room}}.",
  "give.success": "{{actor.name}}ให้{{targetName}}ชิ้นส่วน{{number}}.",

  "go.alreadyThere": "{{actor.name}}อยู่ใน{{targetRoom}}แล้ว.",
  "go.didntExist": "{{actor.name}}ต้องการไปยัง{{targetRoom}}, แต่สถานที่นั้นยังไม่ได้ถูกสร้าง.",
  "go.success": "{{actor.name}}ไปยัง{{targetRoom}}.",

  "heal.badName": "แต่{{actor.name}}ไม่สามารถรักษา{{targetName}}เพราะเขาไม่สามารถหาพวกเขา.",
  "heal.alreadyDead": "แต่{{actor.name}}ไม่สามารถรักษา{{targetName}}เพราะพวกเขาตายแล้ว.",
  "heal.alreadyReturned": "แต่ {{actor.name}} ไม่สามารถรักษา {{targetName}} เพราะพวกเขาได้กลับไปยังผู้เรียกของพวกเขาแล้ว.",
  "heal.notInRoom": "แต่{{actor.name}}ไม่สามารถรักษา{{targetName}} เพราะ{{targetName}} ไม่ได้อยู่ใน {{actor.room}}.",
  "heal.alreadyFull": "แต่{{actor.name}} ไม่สามารถรักษา {{targetName}} เพราะพวกเขามีสุขภาพเต็มแล้ว.",
  "heal.self.alreadyFull": "แต่ {{actor.name}} ไม่สามารถรักษาได้เนื่องจากสุขภาพแข็งแรงสมบูรณ์แล้ว",
  "heal.self": "{{actor.name}} รักษาตัวเองให้สุขภาพ {{heal}}.",
  "heal.other": "{{actor.name}} รักษา {{targetName}} ให้สุขภาพ {{heal}}.",
  "heal.rest": "{{actor.name}} พักผ่อนสักสองสามชั่วโมง, รับประทานอาหารและดูแลแผลที่บาดเจ็บ. {{actor.name}} ได้รับการรักษา {{heal}}HP.",
  
  "mob": "ตัวประจำ",
  "mob.hello": "สวัสดี.",
  "mob.spawn": "{{actor.name}} ปรากฏขึ้นใน {{actor.room}}.",

  "mode.turns": "โลกกำลังเคลื่อนไหวในเทิร์น.",
  "mode.time": "โลกเคลื่อนไหวในรัศมีของเหตุการณ์หนึ่งทุกๆ {{seconds}} วินาที.",
  "mode.turns.changed": "{{actor.name}} ใช้เวทย์มนต์. โลกเริ่มเคลื่อนไหวในเทิร์น.",
  "mode.time.changed": "{{actor.name}} ใช้เวทย์มนต์. โลกเริ่มเคลื่อนไหวในรัศมีของเหตุการณ์หนึ่งทุกๆ {{seconds}} วินาที.",
  "mode.invalid": "แต่{{actor.name}} ไม่สามารถเปลี่ยนโหมด. โหมดที่ถูกต้องคือ \"turns\" และ \"time\".",

  "pace.turns": "โลกเคลื่อนไหวในเทิร์น.",
  "pace.seconds": "โลกเคลื่อนไหวในรัศมีของเหตุการณ์หนึ่งทุกๆ {{seconds}} วินาที.",
  "pace.paused": "โลกถูกหยุด.",
  "pace.nan": "แต่ {{actor.name}} ไม่สามารถเปลี่ยนแปลงจังหวะของโลก เพราะ {{action.text}} ไม่ใช่ตัวเลข.",
  "pace.pause.noShards": "แต่ {{actor.name}} ไม่สามารถหยุดโลกได้ เพราะพวกเขาไม่มีแชร์ด.",
  "pace.pause": "{{actor.name}} สละแชร์ดเพื่อหยุดโลก.",
  "pace.faster.noShards": "แต่ {{actor.name}} ไม่สามารถเพิ่มความเร็วของโลก เพราะพวกเขาไม่มีแชร์ด.",
  "pace.faster": "{{actor.name}} สละแชร์ดเพื่อเพิ่มความเร็วของโลกเป็นเหตุการณ์หนึ่งทุก {{seconds}} วินาที.",
  "pace.faster.limited": "{{actor.name}} สละแชร์ดเพื่อเพิ่มความเร็วของโลกเป็นเหตุการณ์หนึ่งทุก {{seconds}} วินาที. ความเร็วไม่สามารถเร็วขึ้นได้อีก.",
  "pace.slower": "{{actor.name}} ลดความเร็วของโลกเป็นเหตุการณ์หนึ่งทุก {{seconds}} วินาที.",

  "protect.noShards": "แต่ {{actor.name}} ไม่สามารถป้องกัน {{actor.room}} เพราะพวกเขาไม่มีแชร์ด.",
  "protect.noMobs": "แต่ {{actor.name}} ไม่สามารถป้องกัน {{actor.room}} เพราะไม่มีศัตรูที่จะป้องกัน.",
  "protect.success": "{{actor.name}} ใช้แชร์ดและป้องกัน {{actor.room}} จากศัตรูขั้นต่ำ.",

  "return.success": "{{actor.name}} กลับไปยังผู้เรียกของพวกเขาและให้พวกเขา {{shards}} แชร์ด, ภารกิจของพวกเขาสมบูรณ์. พวกเขาจากนั้นจะหายไปในควัน.",

  "scry.noShards": "แต่ {{actor.name}} ไม่สามารถเห็น {{targetName}} เพราะพวกเขาไม่มีแชร์ด.",
  "scry.success": "{{actor.name}} สละแชร์ดเพื่อมองลงไปในอดีต. {{actor.name}} สามารถเห็นทุกสิ่งที่เกิดขึ้นใน {{actor.room}}.",

  "search.fail": "{{actor.name}} ค้นหาแชร์ดใน {{actor.room}} แต่ไม่พบอะไร.",
  "search.foundItems": "{{actor.name}} ค้นหาใน {{actor.room}}. {{actor.name}} พบของที่มีประโยชน์บางอย่าง, แต่ไม่พบแชร์ด.",
  "search.foundShard": "{{actor.name}} ค้นหาใน {{actor.room}} และพบแชร์ด.",

  "strike.badName": "แต่ {{actor.name}} ไม่สามารถโจมตี {{targetName}} เพราะพวกเขาไม่สามารถหาพวกเขา.",
  "strike.alreadyDead": "แต่ {{actor.name}} ไม่สามารถโจมตี {{targetName}} เพราะพวกเขาถูกฆ่าแล้ว.",
  "strike.notInRoom": "แต่ {{actor.name}} ไม่สามารถโจมตี {{targetName}} เพราะพวกเขาไม่อยู่ในห้องเดียวกัน.",
  "strike.missed": "{{actor.name}} พยายามโจมตี, แต่พลาด.",
  "strike.target.missed": "{{actor.name}} พยายามโจมตี {{targetName}}, แต่พลาด.",
  "strike.hit": "{{actor.name}} โจมตี {{targetName}} และทำให้เกิดความเสียหาย {{damage}}.",
  "strike.hit.sacrifice": "{{actor.name}} โจมตี {{targetName}} และทำให้เกิดความเสียหาย {{damage}}. {{targetName}} สละ {{sacrifice}} แชร์ดเพื่อบล็อกความเสียหาย.",
  "strike.hit.kill": "{{actor.name}} โจมตี {{targetName}} และทำให้เกิดความเสียหาย {{damage}}. {{targetName}} ตาย.",
  "strike.hit.sacrifice.kill": "{{actor.name}} โจมตี {{targetName}} และทำให้เกิดความเสียหาย {{damage}}. {{targetName}} สละ {{sacrifice}} แชร์ดเพื่อบล็อกความเสียหาย, แต่มันไม่เพียงพอ. {{targetName}} ตาย.",

  "summon.noScript": "แต่ {{actor.name}} ไม่สามารถเรียก {{summonName}} เพราะไม่มีสคริปต์ชื่อ {{summonName}}.",
  "summon.noShards": "แต่ {{actor.name}} ไม่สามารถเรียก {{summonName}} เพราะพวกเขาไม่มีแชร์ด.",
  "summon.success": "{{actor.name}} ใช้แชร์ดและเรียก {{summonName}}.",
  "summon.player.origin": "{{summonName}} ถูกเรียก. {{summonName}} ปรากฏขึ้นในต้นกำเนิด.",

  "tutorial": `ไม่ทราบว่าควรทำอะไรในโลกใหม่นี้, {{actor.name}} พิจารณาตัวเลือกหลายๆ อย่าง:

%search% - เพื่อได้รับแชร์ด
%go ...% - เพื่อสำรวจโลก.
%strike% - เพื่อต่อสู้
%heal% - เพื่อรักษา
%summon Odel% (ต้นทุน: 1 แชร์ด) - Odel มีความชำนาญในการค้นหาแชร์ด.
%create ...% (ต้นทุน: 1 แชร์ด) - สร้างที่ดินหรือสถานที่ใหม่. คุณสามารถสร้างสิ่งที่คุณจินตนาการได้. ที่ดินใหม่มักมีแชร์ดเพียบ, ดังนั้นการใช้แชร์ดในการสร้างจึงคุ้มค่า.
%destroy% (ต้นทุน: 1 แชร์ด) - เพื่อทำลายที่ดิน.
%protect% (ต้นทุน: 1 แชร์ด) - เพื่อปกป้องที่ดินจากศัตรูขั้นต่ำ.
%scry% (ต้นทุน: 1 แชร์ด) - เพื่อดูสิ่งที่เกิดขึ้นในที่นี่ในอดีต.`,
};

