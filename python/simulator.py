import mysql.connector
import datetime
import random
import time

#database connection
db = mysql.connector.connect(host="127.0.0.1", port="3306", user="root", password="root", database="clinics")

#cursor object
cur = db.cursor()

cur.execute("SELECT AVG(CASE WHEN clinic_id=3 AND diff IS NOT NULL THEN diff END) FROM sessions")	
three = cur.fetchone()[0]

cur.execute("SELECT AVG(CASE WHEN clinic_id=2 AND diff IS NOT NULL THEN diff END) FROM sessions")	
two = cur.fetchone()[0]

cur.execute("SELECT AVG(CASE WHEN clinic_id=1 AND diff IS NOT NULL THEN diff END) FROM sessions")	
one = cur.fetchone()[0]


cur.close()
	
print('Average clinic one: '+str(one)+'\nAverage clinic two: '+str(two)+'\nAverage clinic three: '+str(three))
print('\nBest average wait time is: ' + str(min(one, two, three)))

#needs to get total null entries and divide that to get the actual wait times


