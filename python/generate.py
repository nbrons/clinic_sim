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
id = 0

while(id<=99):
	#clinic = random.randint(1,3)
	clinic = 1
	currtime = ts.strftime('%Y-%m-%d %H:%M:%S')


	cur.execute("SELECT * FROM sessions where idsessions=(SELECT MAX(idsessions) FROM sessions WHERE idsessions<"+str(id)+" AND clinic_id="+str(clinic)+" AND end IS NOT NULL)")

	try:
		returns = cur.fetchone()
		prev_time = returns[4]
		est_time_last = returns[5]
	except IndexError:
		prev_time = 0
		est_time_last=0
	except TypeError:
		prev_time = 0
		est_time_last=0
		
	est_time = (prev_time/2)+(est_time_last/2)
	
	#print (est_time)
	
    
	cur.execute("INSERT INTO sessions (idsessions, clinic_id, start, est_time) VALUES ("+str(id)+", "+ str(clinic)+", '"+currtime+"', '"+str(est_time)+"');")
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
	