module.exports = {
  "intro": "ใครหลงทางในความว่างเปล่า? %summon Player%",

  "action.go": "ไป",
  "action.create": "สร้าง",
  "action.give": "ให้",
  "action.scry": "สกรี",
  "action.return": "การกลับมา",
  "action.disappear": "หายไป",
  "action.strike": 'ตี',
  "action.summon": "เรียก",
  "action.heal": "รักษา",
  "action.protect": "ป้องกัน",
  "action.search": "ค้นหา",
  "action.destroy": "ทำลาย",

  "origin.name": "ต้นทาง",
   "origin.description": "ในห้องใต้ดินลึก มีศาลเจ้าที่สร้างขึ้นรอบๆ น้ำพุ แสงสว่างเพียงอย่างเดียวคือคริสตัลสีฟ้าเรืองแสงที่ติดอยู่บนผนังที่มีตะไคร่น้ำ",

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
Name: ปราสาทแห่งแสง
Title: เธอ
Description: ปราสาทแห่งแสง, ซึ่งเป็นพ่อมดหญิงที่มีอำนาจในเวทมนตร์แห่งแสง, คอยค้นหาความรู้และความจริงที่ซ่อนอยู่ในโลกนี้ด้วยไม้เท้ามหัศจรรย์ของเธอ
%%%

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

  /* prompt.bot */

  "prompt.bot": `นี่คือเกมบทบาทที่มีข้อความเป็นฐานในโลกแฟนตาซียุคกลาง. ฉันคือ {{actor.name}}. ฉันถูกเรียกขึ้นโดย {{actor.summoner}}.
  
  {{actor.script}}
  การกระทำที่แนะนำ
  
  {{suggestionsText}}
  บริบท
  
  ฉันอยู่ใน{{actor.room}}. มีสิ่งมีชีวิตอยู่ใน{{actor.room}}: {{inRoomText}}. ฉันมี {{actor.hp}}/{{maxHP}} HP และฉันถือ {{actor.shards}} ชิ้น.
  คำแนะนำ
  
  ให้แสดงผลเฉพาะการตอบสนองของ {{actor.name}}. ให้รักษาความสั้นกระชับในการตอบสนอง ไม่เกิน 20 คำ. ถ้า {{actor.name}} ดำเนินการใด ๆ ให้แสดงผลการกระทำที่แนะนำในส่วนของการตอบสนอง. ตัวอย่าง:
  {{actor.name}}: ฉันต้องไป! %ไป ป่า%
  ประวัติ
  
  {{historyText}}
  การตอบสนอง
  
  {{actor.name}}: `,

  /* prompt.narration */
  "prompt.narration": `นี่คือเกมบทบาทที่มีข้อความเป็นฐานในโลกแฟนตาซียุคกลาง ฉันคือผู้บรรยาย
  
  ### บริบท
  {{room.description}} สิ่งมีชีวิตที่อยู่ใน{{room.name}} ณ ตอนนี้: {{inRoomText}} และเท่านั้น
  
  {{descriptions}}
  
  ### คำแนะนำ
  ปรับปรุงการบรรยายต่อไปนี้ ให้คำตอบสั้น ๆ ไม่เกิน 20 คำ รักษารายละเอียดทั้งหมด โดยเฉพาะตัวเลข แก้ไขข้อผิดพลาดทางไวยากรณ์, การใช้ตัวพิมพ์ใหญ่และการใช้พหูพจน์, และอื่น ๆ เพิ่มความตื่นเต้นและภาษาที่น่าสนใจ ทำให้ข้อมูลทั่วไปเป็นเฉพาะเจาะจง (เช่น "กินอาหาร" => "รับประทานอาหารยามเย็นที่อร่อยที่ประกอบด้วยกระต่ายต้ม") บรรยายเฉพาะเหตุการณ์ที่กล่าวถึงในการบรรยายเดิม ใช้เวลาอดีต ต่อเนื่องการบรรยายกับประวัติศาสตร์และบริบท ทำให้ดูเหมือนนิทานเก่า
  
  ### ตัวอย่าง
  ต้นฉบับ: อนุมาน รักษา อนุมาน สำหรับ 2HP อนุมาน ค้นหาที่มาและพบ สารทขาว อนุมาน ค้นหาที่มาสำหรับ สารทขาว อนุมาน พบสิ่งของที่มีประโยชน์บางอย่าง แต่ไม่มี สารทขาว บาร์ดรุนแรงโจมตี อนุมาน
  การตอบสนอง: หลังจากการต่อสู้ อนุมาน รักษาตนเองสำหรับ 2HP จากนั้นเขาเห็นถึงภารกิจสำคัญที่สุด: การค้นหา สารทขาว หลายชั่วโมงที่ผ่านไป เขาค้นหาในโลกมืดที่ไม่มีอะไร... จนกระทั่งสุดท้ายเขาพบ สารทขาว! ด้วยความปรารถนาที่ขึ้นสูง เขาเริ่มการค้นหาของเขา แต่ สารทขาว ที่สองจะหลีกเลี่ยงไป เมื่อการค้นหาอย่างตั้งใจของ อนุมาน ส่งผลเพียงเครื่องมือเก่าแก่ Bard ที่ระเบิดแรงโจมตีอย่างกะทันหัน

### ประวัติศาสตร์
{{historyText}}

### การบรรยายเดิม
ผู้บรรยาย: {{narration}}

### การตอบสนอง
ผู้บรรยาย: `,

  "prompt.characterBuilder": `### บริบท
  Exousius เป็นแผ่นดินที่กำลังมีสงคราม ก่อนหน้านี้มีความสงบสุขในราชอาณาจักร แต่จากนั้นมีการค้นพบของการเรียกวิญญาณ นักเวทย์และนักรบได้ค้นหาอย่างกว้างขวางสำหรับสารัตภัญฑ์ที่มีค่า และพร้อมที่จะฆ่าเพื่อสิ่งเหล่านั้น คุณต้องพาผู้เล่นเข้าสู่โลกนี้ด้วยความเศร้า ด้วยความจำเป็นที่ผู้เล่นต้องเข้าร่วมสงครามที่ไร้สาระนี้
  
### คำสั่ง
นำผู้เล่นในการสนทนาผ่านขั้นตอนต่อไปนี้:

1. ขอโทษผู้เล่นสำหรับความจำเป็นที่ต้องพาพวกเขามาที่นี่

2. ตรวจสอบว่าผู้เล่นเป็นคนใหม่ในแผ่นดินเหล่านี้ หรือพวกเขาเป็นนักรบที่มีประสบการณ์

3. ถามผู้เล่นว่าพวกเขามีความชำนาญในเวทมนตร์หรือในการใช้ดาบ ใช้การตอบของพวกเขาเพื่อกำหนดตัวละครของพวกเขา (วิญญาณเวท, อัศวิน, โจร, และอื่น ๆ)

4. กำหนดเสื้อผ้าของตัวละคร, ลักษณะเด่น, และประวัติย่อย สิ่งเหล่านี้ไม่สำคัญต่อการเล่นเกม

5. กำหนดอาวุธของผู้เล่น สิ่งนี้ไม่สำคัญต่อการเล่นเกม

6. ตระหนักว่าคุณลืมถามชื่อผู้เล่น ถามชื่อของผู้เล่น - แต่ชื่อผู้เรียกของพวกเขา ไม่ใช่ชื่อจริง คุณยินดีที่จะแนะนำชื่อหากผู้เล่นดูไม่ค่อยมีความคิดสร้างสรรค์ ชื่อสั้นๆน่าสนใจ ถ้าผู้เล่นให้ชื่อเช่น "กริมนอร์ผู้น่ากลัว" ให้ย่อมันเป็น "กริมนอร์" เท่านั้น

7. ถาม "คุณต้องการให้เรียกคุณอย่างไร? ใช้ 'คุณ' หรือ 'เขา/เธอ'... หรือ 'fae' อาจจะเป็น?" อย่าใช้คำว่า "สรรพนาม" ผู้เล่นสามารถเลือกคำอื่น ๆ เช่น "พวกเขา", "คุณ", "มัน" ฯลฯ

8. แสดงข้อมูลตัวละครในรูปแบบต่อไปนี้:

%%% CHARACTER
Name: ชื่อผู้เล่น (สั้น ๆ)
Title: คุณ
Description: คำอธิบายของตัวละครผู้เล่น เริ่มต้นด้วยชื่อตัวละคร เขียนในช่วงเวลาที่ผ่านมา ใช้สรรพนามของตัวละคร อย่าใช้คำว่า "แบบนี้" (เช่น Dumbledore-like) แทนที่จะใช้คำอธิบายที่แม่นยำเช่น "มีใบหน้าแก่ กับผมยาวสีเทาและดำ" รวมถึงอาวุธของผู้เล่นด้วย คำอธิบายควรมีความยาวประมาณ 30 คำทั้งหมดในบรรทัดเดียว
%%%

(คุณต้องใช้เครื่องหมายเปอร์เซ็นต์สามครั้งเพื่อคั่นข้อมูล)

ตัวอย่าง: อลิซผู้ทรงเจ้าชนะแห่งโจรสลัด

%%% CHARACTER
Name: อลิซ
Title: คุณ
Description: คุณเรียกเธอว่าอลิซ ที่เคยเป็นเจ้าหญิงและกลายเป็นโจรสลัดที่กล้าหาญ เธอใช้อาวุธคือดาบสั้นและปืน อลิซมีผมยาวคล้องคลาไคล และแผลบนแก้มซ้ายของเธอ
%%%

9. ยืนยันว่าผู้เล่นพอใจกับตัวละครของพวกเขาหรือไม่ ถ้าไม่ใช่ ให้เปลี่ยนตัวละครให้ตรงกับความต้องการของผู้เล่น แล้วแสดงข้อมูลตัวละครอีกครั้งในรูปแบบเดียวกับด้านบน

10. ขอบคุณผู้เล่นสำหรับการเป็นนักรบแห่งความกล้าหาญ และต้อนรับพวกเขาเข้าสู่ Exousius แสดงข้อมูลตัวละครอีกครั้ง จากนั้นแสดง %summon ชื่อผู้เล่น% หลังจากคุณแสดง %summon ...% ผู้เล่นจะถูกส่งไปยังโลกของ Exousius

ตรวจสอบขั้นตอนที่คุณอยู่ในการสนทนา และแสดงคำตอบที่เหมาะสมสำหรับขั้นตอนนั้น

### ประวัติ
{{historyText}}

### การตอบสนอง
ผู้บรรยาย: `,

};

/*
Pat's conversation:

๑๐
ต้นทาง
๐
Exousius
Exousius
(A game by Lone Pine)
Narratorใครหลงทางในความว่างเปล่า?
Playerสวัสดีค่ะ
Narratorขอโทษที่ต้องพาคุณมาที่นี่ในช่วงเวลาที่ยากลำบากแบบนี้ คุณเป็นคนใหม่ในแผ่นดินเหล่านี้หรือคุณคือนักรบที่มีประสบการณ์อยู่แล้วครับ?
Playerใช่ฉันเป็นคนใหม่ที่นี่
Narratorขอขอบคุณที่ตอบข้อสงสัยของเรา คุณมีความชำนาญในเวทมนตร์หรือในการใช้ดาบครับ?
Playerไม่มีทั้งสองคะ
Narratorขอโทษที่ต้องนำคุณมาที่นี่ในช่วงเวลาที่ยากลำบากแบบนี้ คุณเป็นคนใหม่ในแผ่นดินเหล่านี้หรือคุณคือนักรบที่มีประสบการณ์อยู่แล้วครับ?
คุณ: ใช่ฉันเป็นคนใหม่ที่นี่
ผู้บรรยาย: ขอขอบคุณที่ตอบข้อสงสัยของเรา คุณมีความชำนาญในเวทมนตร์หรือในการใช้ดาบครับ?

คุณ: ไม่มีทั้งสองคะ
ผู้บรรยาย: ไม่เป็นไรเลย คุณยังสามารถเป็นนักรบกล้าหาญได้ในปราสาทของ Exousius หากคุณต้องการเรียนรู้ศิลปะการต่อสู้หรือเวทมนตร์ มาเราจะเลือกตัวละครและชุดเสื้อผ้าให้คุณใส่เสียก่อน เสื้อผ
Playerโอเครคพ
Narratorขอโทษที่ต้องพาคุณมาที่นี่ในช่วงเวลาที่ยากลำบากแบบนี้ คุณเป็นคนใหม่ในแผ่นดินเหล่านี้หรือคุณคือนักรบที่มีประสบการณ์อยู่แล้วครับ?
Playerฉันเป็นคนใหม่ที่นี่
Narratorขอโทษที่ต้องพาคุณมาที่นี่ในช่วงเวลาที่ยากลำบากแบบนี้ คุณเป็นคนใหม่ในแผ่นดินเหล่านี้หรือคุณคือนักรบที่มีประสบการณ์อยู่แล้วครับ?
Playerฉันต้องการเป็นนักรบ
...
Player
*/
