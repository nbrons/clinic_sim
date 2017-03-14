# clinic_sim
A calgary clinic waiting time optimizer.

The latest API can be viewed in the App folder. Python and WWW folders are front/backend simulators designed in Python and PHP to simulate the calcuations required, before sending the data to the API. 

NOTE: A valid Cloudant Database is required for this project, please contact me for sample data.

# Deployment 
Simply replace all the constants with your Google Maps, Cloudant, and Watson Tradeoff Analytics keys. Upload the two JS files to separate Node JS applications on IBM Bluemix, then update their manifest to reflect the manifest file. Set up deployment pipelines, version control, and team management how you would like it to be configured, and deploy the application. 

The URLs can now be used as an API to check in/out devices, as well as return the optimal clinic with the minimal waiting time, given the AI's decision based on driving distance, waiting time, proximity, hours, and severity. 

This Express JS API was originally developed for use with a Bluetooth beacon, which checked in/out devices automatically and stored information in a Cloudant database. 
