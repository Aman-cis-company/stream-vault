backend command for first time
npm install
npm run db:migrate         # create all 9 tables
npm run db:seed            # seed roles, users, plans
npm run dev                # start dev server (port 5000)

frontend command
npm run dev

Admin login
admin@streamvault.com / Admin@123456



bunny.net
username = aman.k@cisinlabs.com
password = Aman@1234567

twillio account
username = 7869215831amankaithwas@gmail.com
password = Aman@123

https://github.com/Aman-cis-company/stream-vault.git


run this command to generate credentials 

node -e "const n = require('nodemailer'); n.createTestAccount().then(a => { console.log('MAIL_USER=' + a.user); console.log('MAIL_PASSWORD=' + a.pass); });"

------------------OPENAI WHISPER for Subtitle----------------
-we use OpenAI whisper free version for auto subtitle generation
-we use whiper as command line (use shell command) 
-Free, but requires Python + Whisper installed on the server

install CLI whiper on local system
commands:-
sudo apt update
sudo apt install python3 python3-pip ffmpeg -y
pip3 install openai-whisper
whisper --help (Verify installation)


---------------------------
HLS Video (HTTP Live Streaming)

1) Create an HLS Video: Upload any .mp4 → Convert → Auto sub → Stream. No encoder needed.
2)Used Adaptive Bitrate Streaming
3)Supported on All Devices and Browsers
4)Apple releases the HLS in 2009

---------------------Run all service of backend-----------------------------
1. Start Services  
npm run start:services

2. Check Status
npx pm2 list

3. View Logs
npm run logs:services

4. Stop Services
npm run stop:services

5. Restart Services
npx pm2 restart all



http://vnak3000.elb.cisinlive.com
http://vnak5000.elb.cisinlive.com


-run build on browser
npm run preview

VaultAssistant:-
https://aistudio.google.com/
use gemini key for free
1. AI Studio Free Key: The API key you got from Google AI Studio is on the Free Tier by default. Google does not request or require billing information to create or use these keys.                                      
2. Free Limits: The key allows up to 15 requests per minute and 1,500 requests per day, which is plenty for development and testing.
3. No-Cost Fallback: Even if you exceed those daily limits, the application will automatically fall back to your local, offline database search engine. You will never face unexpected charges. 

--------------------------------------------------------------------------------------
To run this code on new machine with docker
-docker compose up --build -d (detached mode) 

Initialize the Database (Migrations & Seeds)
# Run migrations to create tables
    docker exec -it streamvault-api-gateway npx sequelize-cli db:migrate

# Run seeds to insert default admin users, plans, and categories
    docker exec -it streamvault-api-gateway npx sequelize-cli db:seed:all

### Steps: Useful Commands for Maintenance
  
  • Check if everything is running:
    docker compose ps
  
  • View live logs of all services:
    docker compose logs -f
  
  • View logs of a specific service (e.g. transcoding):
    docker compose logs transcoding-service -f
  
  • Stop all services:
    docker compose down

