/* Original lesson text and illustrations for Nattsun LABO. No remote API. */
(function(root){
'use strict';
const languages={en:{name:'英語',native:'English',locale:'en-US',mark:'Aa'},ja:{name:'日本語・漢字',native:'日本語',locale:'ja-JP',mark:'あ'},fr:{name:'フランス語',native:'Français',locale:'fr-FR',mark:'É'},ru:{name:'ロシア語',native:'Русский',locale:'ru-RU',mark:'Я'},zh:{name:'中国語',native:'普通话 · 简体字',locale:'zh-CN',mark:'中'},ko:{name:'韓国語',native:'한국어',locale:'ko-KR',mark:'한'}};
const scenes=[
['coffee','日常','カフェで注文','コーヒーを1杯、丁寧に注文してください。','コーヒーを1杯お願いします。','注文では、欲しい物に丁寧な依頼の表現を添えます。'],
['station','日常','駅を探す','駅がどこにあるか尋ねてください。','駅はどこですか。','場所を尋ねる言い方です。案内を聞き取れなければ聞き返しましょう。'],
['price','日常','買い物をする','目の前の商品がいくらか尋ねてください。','これはいくらですか。','指し示す物と値段を尋ねる表現を組み合わせます。'],
['repeat','日常','聞き返す','聞き取れなかったので、もう一度言ってもらってください。','もう一度言っていただけますか。','分かったふりをせず、繰り返しをお願いする練習です。'],
['reservation','日常','予約を伝える','予約していることを伝えてください。','予約しています。','到着時に予約があることを伝える短い表現です。'],
['intro','ビジネス','初めての挨拶','初めて会う取引先に「お会いできてうれしいです」と伝えてください。','お会いできてうれしいです。','初対面の挨拶です。自己紹介と続けて使えます。'],
['email','ビジネス','資料を頼む','資料をメールで送ってもらうよう丁寧に依頼してください。','資料をメールで送っていただけますか。','何を、どの方法で送ってほしいかを明確にします。'],
['deadline','ビジネス','締切を確認','締切がいつか尋ねてください。','締切はいつですか。','期限を推測せず、日時を確認する表現です。'],
['meeting','ビジネス','会議の予定','会議を明日に変更できるか尋ねてください。','会議を明日に変更できますか。','変更する予定と新しい日程をセットで伝えます。'],
['check','ビジネス','確認して返答','確認した後で返答すると伝えてください。','確認してからお返事します。','すぐに答えられないとき、確認することと返答を約束します。']
];
// Each row: accepted expressions, phrase reading (where useful), key word, meaning.
const phrases={
en:[
[['Could I have a coffee, please?',"I'd like a coffee, please.",'Can I have a coffee, please?'],'','coffee','コーヒー'],
[['Where is the station?',"Where's the station?"],'','station','駅'],
[['How much is this?','How much does this cost?'],'','How much','いくら'],
[['Could you say that again, please?','Could you repeat that, please?'],'','again','もう一度'],
[['I have a reservation.',"I've got a reservation."],'','reservation','予約'],
[["It's a pleasure to meet you.",'Nice to meet you.','Pleased to meet you.'],'','meet','会う'],
[['Could you email me the documents?','Could you send me the documents by email?'],'','documents','資料・書類'],
[['When is the deadline?',"When's the deadline?"],'','deadline','締切'],
[['Could we reschedule the meeting for tomorrow?','Can we move the meeting to tomorrow?'],'','tomorrow','明日'],
[["I'll check and get back to you.",'I will check and get back to you.'],'','get back to you','後で返答する']
],
ja:[
[['コーヒーを1杯お願いします。','コーヒーを一杯お願いします。','コーヒーを一杯ください。','コーヒーを1杯ください。'],'こーひーをいっぱいおねがいします','一杯','いっぱい'],
[['駅はどこですか。','駅はどちらですか。'],'えきはどこですか','駅','えき'],
[['これはいくらですか。','こちらはいくらですか。'],'これはいくらですか','いくら','値段を尋ねる言葉'],
[['もう一度言っていただけますか。','もう一度おっしゃっていただけますか。','もう一度お願いします。'],'もういちどいっていただけますか','もう一度','もういちど'],
[['予約しています。','予約をしています。','予約してあります。'],'よやくしています','予約','よやく'],
[['お会いできてうれしいです。','お会いできて嬉しいです。','お会いできて光栄です。'],'おあいできてうれしいです','お会いする','「会う」の丁寧な表現'],
[['資料をメールで送っていただけますか。','資料をメールでお送りいただけますか。'],'しりょうをめーるでおくっていただけますか','資料','しりょう'],
[['締切はいつですか。','締め切りはいつですか。','締め切りはいつでしょうか。'],'しめきりはいつですか','締切','しめきり'],
[['会議を明日に変更できますか。','会議を明日に変更していただけますか。'],'かいぎをあしたにへんこうできますか','変更','へんこう'],
[['確認してからお返事します。','確認後にお返事します。','確認してからご連絡します。'],'かくにんしてからおへんじします','確認','かくにん']
],
fr:[
[["Je voudrais un café, s'il vous plaît.","Un café, s'il vous plaît."],'','un café','コーヒー1杯'],
[['Où est la gare?','Où se trouve la gare?'],'','la gare','駅'],
[['Combien ça coûte?','Quel est le prix?'],'','combien','いくら'],
[["Pouvez-vous répéter, s'il vous plaît?","Pourriez-vous répéter, s'il vous plaît?"],'','répéter','繰り返す'],
[["J'ai une réservation."],'','une réservation','予約'],
[['Je suis ravi de vous rencontrer.','Je suis ravie de vous rencontrer.'],'','vous rencontrer','あなたにお会いする'],
[['Pourriez-vous m’envoyer les documents par e-mail?','Pouvez-vous m’envoyer les documents par e-mail?'],'','les documents','資料・書類'],
[['Quelle est la date limite?'],'','la date limite','締切日'],
[['Pourrions-nous reporter la réunion à demain?','Peut-on reporter la réunion à demain?'],'','demain','明日'],
[['Je vais vérifier et je vous répondrai.','Je vais vérifier et revenir vers vous.'],'','vérifier','確認する']
],
ru:[
[['Можно мне чашку кофе, пожалуйста?','Чашку кофе, пожалуйста.'],'','кофе','コーヒー'],
[['Где находится вокзал?','Где вокзал?'],'','вокзал','鉄道駅'],
[['Сколько это стоит?'],'','сколько','いくら・どれくらい'],
[['Повторите, пожалуйста.','Не могли бы вы повторить?'],'','повторить','繰り返す'],
[['У меня есть бронь.','У меня забронировано.'],'','бронь','予約'],
[['Рад с вами познакомиться.','Рада с вами познакомиться.','Приятно познакомиться.'],'','познакомиться','知り合う'],
[['Не могли бы вы отправить мне документы по электронной почте?','Могли бы вы отправить мне документы по электронной почте?'],'','документы','資料・書類'],
[['Какой крайний срок?','Когда крайний срок?'],'','крайний срок','締切'],
[['Можно перенести встречу на завтра?','Можем ли мы перенести встречу на завтра?'],'','завтра','明日'],
[['Я проверю и отвечу вам.','Я уточню и отвечу вам.'],'','проверить','確認する']
],
zh:[
[['请给我一杯咖啡。','麻烦给我一杯咖啡。'],'Qǐng gěi wǒ yì bēi kāfēi.','咖啡','kāfēi · コーヒー'],
[['火车站在哪里？','请问，火车站在哪儿？','请问火车站在哪里？'],'Huǒchēzhàn zài nǎlǐ?','火车站','huǒchēzhàn · 鉄道駅'],
[['这个多少钱？','请问，这个多少钱？'],'Zhège duōshao qián?','多少钱','duōshao qián · いくら'],
[['请再说一遍。','可以再说一遍吗？'],'Qǐng zài shuō yí biàn.','再','zài · もう一度'],
[['我有预约。','我已经预约了。'],'Wǒ yǒu yùyuē.','预约','yùyuē · 予約'],
[['很高兴认识您。','认识您很高兴。'],'Hěn gāoxìng rènshi nín.','您','nín · あなた（丁寧）'],
[['可以通过电子邮件把资料发给我吗？','能把资料通过电子邮件发给我吗？'],'Kěyǐ tōngguò diànzǐ yóujiàn bǎ zīliào fā gěi wǒ ma?','资料','zīliào · 資料'],
[['截止日期是什么时候？','什么时候截止？'],'Jiézhǐ rìqī shì shénme shíhou?','截止日期','jiézhǐ rìqī · 締切日'],
[['可以把会议改到明天吗？','能把会议改到明天吗？'],'Kěyǐ bǎ huìyì gǎi dào míngtiān ma?','明天','míngtiān · 明日'],
[['我确认后再回复您。','我先确认一下，再回复您。'],'Wǒ quèrèn hòu zài huífù nín.','确认','quèrèn · 確認する']
],
ko:[
[['커피 한 잔 주세요.','커피 한 잔 부탁드려요.'],'','커피','コーヒー'],
[['기차역이 어디에 있어요?','기차역은 어디예요?'],'','기차역','鉄道駅'],
[['이거 얼마예요?','이것은 얼마인가요?'],'','얼마','いくら'],
[['다시 한 번 말씀해 주시겠어요?','다시 한번 말씀해 주세요.'],'','다시','もう一度'],
[['예약했어요.','예약했습니다.'],'','예약','予約'],
[['만나 뵙게 되어 반갑습니다.','만나서 반갑습니다.'],'','반갑습니다','お会いできてうれしいです'],
[['자료를 이메일로 보내 주시겠어요?','자료를 이메일로 보내 주실 수 있나요?'],'','자료','資料'],
[['마감일이 언제인가요?','마감일은 언제예요?'],'','마감일','締切日'],
[['회의를 내일로 변경할 수 있을까요?','회의를 내일로 미룰 수 있을까요?'],'','내일','明日'],
[['확인 후 답변드리겠습니다.','확인하고 답변드리겠습니다.'],'','확인','確認']
]};
const kanji=[['持ち手','バッグの持ち手を握る。','もちて','もちしゅ','もちで'],['明日','明日の会議に出席する。','あした','めいにち','あす','みょうにち'],['資料','資料をメールで送る。','しりょう','しりょ','しりゅう'],['確認','予定を確認する。','かくにん','かくじん','かくねん'],['予約','レストランを予約する。','よやく','よくやく','ややく'],['締切','締切までに提出する。','しめきり','ていせつ','しめぎり'],['変更','予定を変更する。','へんこう','べんこう','へんごう'],['受付','受付で名前を伝える。','うけつけ','じゅふ','うけふ'],['相手','相手の話を聞く。','あいて','そうしゅ','あいしゅ'],['伝える','希望を伝える。','つたえる','でんえる','つてえる']];
const questions=[];
for(const lang of Object.keys(languages))scenes.forEach((s,i)=>{const p=phrases[lang][i];questions.push({id:lang+'-'+s[0],lang,scene:s[0],category:s[1],title:s[2],prompt:s[3],meaning:s[4],note:s[5],answers:p[0],reading:p[1],word:p[2],wordMeaning:p[3],kind:'phrase'});});
kanji.forEach((k,i)=>questions.push({id:'ja-kanji-'+i,lang:'ja',scene:i<5?'reservation':'email',category:'漢字',title:k[0]+'の読み',prompt:'「'+k[1]+'」の「'+k[0]+'」を、ひらがなで答えてください。',meaning:k[0],answers:i===1?[k[2],k[4],k[5]]:[k[2]],wrong:i===1?[k[3],'あしたら']:[k[3],k[4]],reading:k[2],word:k[0],wordMeaning:k[2],note:i===1?'「明日」は「あした・あす・みょうにち」と読めます。場面で使い分けます。':'この文脈での読みを練習します。',kind:'kanji'}));
const data={languages,questions,version:1};root.LABOLessons=data;if(typeof module!=='undefined')module.exports=data;
})(typeof window!=='undefined'?window:globalThis);
