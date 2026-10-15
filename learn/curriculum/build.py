from pathlib import Path
import json,collections
B=Path(__file__).parent;root=B.parent
compact_source=json.loads((root/'kanji-data.js').read_text().removeprefix('window.LABOKanji=').strip().removesuffix(';'))
entries=[{'kanji':c,'grade':g,'readings':[{'text':r,'stage':s,'type':t,'page':p} for r,s,t,p in rs]} for c,g,rs in compact_source];bykanji={x['kanji']:x for x in entries}
# Store source facts compactly, not full PDF/dictionary downloads.
compact=[[e['kanji'],e['grade'],[[r['text'],r['stage'],r['type'],r['page']] for r in e['readings']]] for e in entries]
(root/'kanji-data.js').write_text('window.LABOKanji='+json.dumps(compact,ensure_ascii=False,separators=(',',':'))+';\n')
words=[];corrected=[]
for n,line in enumerate((B/'kanji-words.tsv').read_text().splitlines()):
 lev,w,rd,sentence=line.split('\t');assert w in sentence
 if lev.isdigit():
  gs=[bykanji[c]['grade'] for c in w if c in bykanji];assert gs and all(gs),(w,gs)
  actual=max(gs)
  if int(lev)!=actual:corrected.append((w,lev,actual))
  lev='g'+str(actual)
 words.append([lev,w,rd.split('|'),sentence])
(root/'kanji-words.js').write_text('window.LABOKanjiWords='+json.dumps(words,ensure_ascii=False,separators=(',',':'))+';\n')
vocab=[x.split('\t') for x in (B/'english-vocabulary.tsv').read_text().splitlines() if x]
sentences=[x.split('\t') for x in (B/'english-sentences.tsv').read_text().splitlines() if x]
assert len(set(x[1] for x in vocab))==240
assert len(sentences)==180
(root/'english-data.js').write_text('window.LABOEnglish='+json.dumps({'vocabulary':vocab,'sentences':sentences},ensure_ascii=False,separators=(',',':'))+';\n')
print('Elementary word placement corrected using official kanji grades:',corrected)
print('English 420 source records; Japanese 2136 characters / 4388 readings + 140 contextual words')
