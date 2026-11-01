from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
import random, math
O=Path(__file__).resolve().parent.parent; W,H=1600,1000
INK='#292925'; MUT='#817e76'; ORANGE='#e68338'; PAPER='#f3f2ee'; LINE='#d9d7d1'
def fill(c,col): c.setFillColor(HexColor(col))
def text(c,x,y,s,size=14,col=INK,font='Helvetica'):
 fill(c,col);c.setFont(font,size);c.drawString(x,H-y-size*.8,s)
def rule(c,x,y,w,col=LINE):c.setStrokeColor(HexColor(col));c.setLineWidth(.8);c.line(x,H-y,x+w,H-y)
def box(c,x,y,w,h,r=25,col='#fdfcf9',shadow=True):
 if shadow:
  for spread,alpha in [(18,.018),(10,.025),(4,.04)]:
   c.setFillColor(Color(.28,.25,.20,alpha=alpha));c.roundRect(x-spread,H-y-h-spread-8,w+spread*2,h+spread*2,r+spread,fill=1,stroke=0)
 fill(c,col);c.setStrokeColor(HexColor('#dedcd5'));c.setLineWidth(.8);c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=1)
 c.setStrokeColor(white);c.roundRect(x+1,H-y-h+1,w-2,h-2,r-1,fill=0,stroke=1)
def dot(c,x,y,color=ORANGE,r=4): fill(c,color);c.circle(x,H-y,r,fill=1,stroke=0)
def label(c,x,y,s):text(c,x,y,s,10,MUT)
def lines(c,x,y,items,size=14,col=MUT,gap=23,font='Helvetica'):
 for i,s in enumerate(items):text(c,x,y+i*gap,s,size,col,font)
def base(c,title,num):
 fill(c,PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 text(c,38,37,'T H E R M O S T A T',15,INK)
 dot(c,42,77);text(c,55,70,'HAMILTON  /  FIELD NOTES',9,MUT)
 text(c,1080,47,'Explore',13,INK);text(c,1170,47,'Records',13,MUT);text(c,1265,47,'Method',13,MUT)
 box(c,1390,30,170,44,22,shadow=False);text(c,1412,44,'Find a place',12,MUT)
 text(c,38,970,f'{num}  /  {title}',10,MUT);text(c,1250,970,'DESIGN STUDY - SAMPLE DATA',9,MUT)
def city(c):
 random.seed(18)
 def pt(x,y,z=0):return (810+(x-y)*36,620+(x+y)*15-z)
 # abstract waterfront, roads and buildings; intentionally not geographic evidence
 fill(c,'#dce3df');p=c.beginPath();p.moveTo(300,H-130);p.lineTo(1540,H-130);p.lineTo(1350,H-260);p.lineTo(300,H-315);p.close();c.drawPath(p,fill=1,stroke=0)
 for k in range(-13,15):
  for axis in [0,1]:
   a=pt(-14,k) if axis==0 else pt(k,-14);b=pt(15,k) if axis==0 else pt(k,15)
   c.setStrokeColor(HexColor('#fffdf7'));c.setLineWidth(8 if k%4 else 12);c.line(a[0],H-a[1],b[0],H-b[1])
 blocks=[]
 for x in range(-13,15):
  for y in range(-13,15):
   if random.random()>.22:blocks.append((x,y,random.uniform(8,65)))
 def poly(points,col):
  fill(c,col);p=c.beginPath();p.moveTo(points[0][0],H-points[0][1])
  for x,y in points[1:]:p.lineTo(x,H-y)
  p.close();c.drawPath(p,fill=1,stroke=0)
 for x,y,z in sorted(blocks,key=lambda b:b[0]+b[1]):
  a,b,d,e=pt(x+.12,y+.12),pt(x+.85,y+.12),pt(x+.85,y+.85),pt(x+.12,y+.85)
  poly([a,b,(b[0],b[1]-z),(a[0],a[1]-z)],'#d0d0c9');poly([b,d,(d[0],d[1]-z),(b[0],b[1]-z)],'#bfc2bb');poly([(a[0],a[1]-z),(b[0],b[1]-z),(d[0],d[1]-z),(e[0],e[1]-z)],'#e6e6de')
 origin=(860,685)
 for i,end in enumerate([(420,350),(600,220),(760,255),(1080,300),(1390,400),(1350,710),(1100,865),(520,810),(380,600)]):
  c.setStrokeColor(HexColor(ORANGE if i<4 else '#a49aa9'));c.setLineWidth(2.8 if i<4 else 1.5);p=c.beginPath();p.moveTo(origin[0],H-origin[1]);p.curveTo(origin[0],H-(origin[1]-230),end[0],H-(end[1]-180),end[0],H-end[1]);c.drawPath(p,stroke=1);dot(c,*end,color=ORANGE if i<4 else '#a49aa9',r=3)
 dot(c,*origin,r=9);c.setStrokeColor(white);c.setLineWidth(3);c.circle(origin[0],H-origin[1],9,fill=0,stroke=1)
c=canvas.Canvas(str(O/'01-Visual-Direction.pdf'),pagesize=(W,H));base(c,'Map workspace',1);city(c)
# cover header with quiet strip to avoid geometry in navigation
fill(c,PAPER);c.rect(0,H-110,W,110,fill=1,stroke=0);text(c,38,37,'T H E R M O S T A T',15);dot(c,42,77);text(c,55,70,'HAMILTON  /  FIELD NOTES',9,MUT);text(c,1080,47,'Explore',13);text(c,1170,47,'Records',13,MUT);text(c,1265,47,'Method',13,MUT);box(c,1390,30,170,44,22,shadow=False);text(c,1412,44,'Find a place',12,MUT)
box(c,32,130,278,808,28)
label(c,60,162,'THE LOCAL PICTURE');text(c,60,194,'Every promise',26);text(c,60,229,'has a place.',26)
lines(c,60,281,['Follow the proposals, the changes,','and the questions still open.'],12,gap=20)
rule(c,60,345,222);label(c,60,371,'01   YOUR AREA');text(c,60,403,'Hamilton, Ontario',15);text(c,261,405,'v',12,MUT)
rule(c,60,449,222);label(c,60,474,'02   ON THE MAP')
for i,(s,on) in enumerate([('Facilities',True),('Heat connections',True),('Buildings',True)]):
 text(c,60,511+i*43,s,13);box(c,246,512+i*43,32,17,8,col=INK,shadow=False);fill(c,'#f9f8f4');c.circle(269,H-(520+i*43),5,fill=1,stroke=0)
rule(c,60,658,222);label(c,60,684,'03   PLACES TO INVESTIGATE')
for i,s in enumerate(['Bayfront Compute','West End Digital','Eastgate Cloud']):
 if i==0:box(c,48,717,246,43,12,col='#f2eee7',shadow=False)
 dot(c,63,739+i*49,color=ORANGE if i==0 else '#bab9b2',r=3);text(c,78,731+i*49,s,12)
text(c,60,892,'Illustrative facilities. Real questions.',9,MUT)
box(c,1150,130,418,686,30);dot(c,1180,166);label(c,1194,159,'SITE 01  /  DEMONSTRATION');text(c,1180,198,'Bayfront Compute',28);text(c,1180,240,'Central Hamilton, Ontario',12,MUT);rule(c,1180,278,358)
for i,(name,detail) in enumerate([('Heat reuse','What was promised?'),('Water demand','What changed?'),('Noise','What is documented?')]):
 y=306+(i*143 if i==0 else 143+(i-1)*75)
 if i==0:
  text(c,1180,y,'01',11,MUT);text(c,1212,y,name,16);text(c,1536,y,'-',17,MUT)
  lines(c,1212,y+41,['A proposed connection.', 'A delivery still to verify.'],17,INK,gap=25,font='Times-Italic');text(c,1212,y+104,'Read the source passage  >',10,ORANGE);rule(c,1180,y+134,358)
 else:
  text(c,1180,y,f'0{i+1}',11,MUT);text(c,1212,y,name,15);text(c,1534,y,'+',17,MUT);rule(c,1180,y+49,358)
label(c,1180,645,'A QUESTION WORTH ASKING');lines(c,1180,674,['Has a heat customer been identified,','or is reuse still only an intention?'],15,INK,gap=22,font='Times-Italic')
box(c,1180,747,199,42,21,col=INK,shadow=False);text(c,1200,761,'Open evidence record  >',11,'#fffdf6');text(c,1400,761,'Save a note  +',11,MUT)
box(c,360,864,348,68,22);dot(c,385,888,r=3);text(c,399,880,'Source',10);dot(c,468,888,color='#a49aa9',r=3);text(c,481,880,'Potential recipient',10);text(c,381,907,'Scenarios, not installed networks.',9,MUT)
text(c,735,922,'Hamilton / an illustrative thermal landscape',13,MUT,'Times-Italic');c.showPage()
base(c,'Evidence & scratchpad',2)
text(c,70,160,'A quieter way to investigate.',43);lines(c,72,225,['Less dashboard chrome. More space for the evidence.'],17,MUT)
box(c,70,310,610,535,32);label(c,106,347,'THE EVIDENCE RECORD');text(c,106,389,'A promise, in its own words.',27)
rule(c,106,445,538);label(c,106,466,'01   INITIAL PROPOSAL / SAMPLE EXCERPT')
lines(c,106,509,['“The project will investigate opportunities','to supply recovered heat to nearby buildings.”'],21,INK,gap=31,font='Times-Italic')
lines(c,106,600,['An intention to investigate is not a delivery commitment.','Original document  >    Page 12    /    12 Jun 2026'],13,MUT,gap=26)
rule(c,106,680,538);label(c,106,706,'YOUR NEXT QUESTION');lines(c,106,744,['Who would receive the heat, and what evidence','would establish that the connection exists?'],16,INK,gap=25)
box(c,770,188,754,706,38);label(c,818,235,'YOUR FIELD NOTES');text(c,1470,230,'x',22)
label(c,818,305,'FIND A PLACE');text(c,818,347,'Search sites or neighbourhoods...',25,MUT);rule(c,818,395,656)
label(c,818,434,'YOUR SHORTLIST');rule(c,818,467,656);text(c,818,501,'Your investigation starts here.',25,MUT,'Times-Italic');rule(c,818,558,656)
text(c,818,584,'Saved places are leads, not conclusions.',14,MUT);label(c,818,645,'YOUR NOTES');text(c,818,685,'What changed? What remains unanswered?',23,MUT,'Times-Italic')
for y in [729,777,825]:rule(c,818,y,656)
text(c,70,903,'SURFACE',9,MUT);text(c,70,925,'Warm white / fine border / soft elevation',13)
text(c,480,903,'TYPE',9,MUT);text(c,480,925,'Quiet sans / occasional editorial serif',13)
text(c,940,903,'ACCENT',9,MUT);text(c,940,925,'Warm amber / reserved for attention',13)
c.save()
print(O/'01-Visual-Direction.pdf')
