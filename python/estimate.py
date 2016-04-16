import mysql.connector
import datetime
import random
import time

#database connection
db = mysql.connector.connect(host="127.0.0.1", port="3306", user="root", password="root", database="clinics")

#cursor object
cur = db.cursor()

today = datetime.date.today()
t = datetime.time(0,0,0)
ts = datetime.datetime.combine(today, t)
id = 208

while(id<=308):
	#clinic = random.randint(1,3)
	clinic = 3
	
	currtime = ts.strftime('%Y-%m-%d %H:%M:%S')
	
	cur.execute("INSERT INTO sessions (idsessions, clinic_id, start) VALUES ("+str(id)+", "+ str(clinic)+", '"+currtime+"');")
	db.commit()
	
	#Random between 5 and 10 mins inclusive
	next = random.randint(300, 900)
	endts = ts + datetime.timedelta(0,next)
	endtime = endts.strftime('%Y-%m-%d %H:%M:%S')
	cur.execute("UPDATE sessions SET end='"+endtime+"' WHERE idsessions="+str(id)+";")
	db.commit()
	next = random.randint(300, 900)
	ts = ts + datetime.timedelta(0,next)
	
	id = id+1

cur.close()
	
print('Success!')
	